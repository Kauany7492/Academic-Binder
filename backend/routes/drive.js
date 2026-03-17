const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

module.exports = (pool) => {
  // ========== CONFIGURAÇÃO DO GOOGLE OAUTH2 ==========
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

  // ========== MIDDLEWARE DE AUTENTICAÇÃO GOOGLE ==========
  async function ensureGoogleAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const [user] = await pool.query('SELECT * FROM usuarios_google WHERE id = ?', [decoded.userId]);
      if (user.length === 0) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      const userData = user[0];
      const oauth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oauth.setCredentials({
        access_token: userData.access_token,
        refresh_token: userData.refresh_token
      });

      if (new Date(userData.token_expiry) < new Date()) {
        console.log('Token expirado, renovando...');
        const { credentials } = await oauth.refreshAccessToken();
        oauth.setCredentials(credentials);
        await pool.query(
          'UPDATE usuarios_google SET access_token = ?, token_expiry = ? WHERE id = ?',
          [credentials.access_token, new Date(credentials.expiry_date), userData.id]
        );
      }

      req.googleAuth = oauth;
      req.userId = userData.id;
      next();
    } catch (err) {
      console.error('Erro no middleware ensureGoogleAuth:', err);
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
  }

  // ========== ROTAS DE AUTENTICAÇÃO ==========
  router.get('/auth/google', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      state: req.query.state
    });
    res.redirect(authUrl);
  });

  router.get('/auth/google/callback', async (req, res) => {
    const { code, state } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      const { id: googleId, email, name } = userInfo.data;

      const [userResult] = await pool.query(
        `INSERT INTO usuarios_google (google_id, email, nome, access_token, refresh_token, token_expiry)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           access_token = VALUES(access_token),
           refresh_token = COALESCE(VALUES(refresh_token), refresh_token),
           token_expiry = VALUES(token_expiry)`,
        [googleId, email, name, tokens.access_token, tokens.refresh_token, new Date(tokens.expiry_date)]
      );

      const userId = userResult.insertId;
      const jwtToken = jwt.sign({ userId, googleId }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.redirect(`${process.env.FRONTEND_URL}/notebooks/${state}?token=${jwtToken}`);
    } catch (error) {
      console.error('Erro no callback OAuth:', error);
      res.redirect(`${process.env.FRONTEND_URL}/?error=auth_failed`);
    }
  });

  // ========== ROTAS DO GOOGLE DRIVE (PROTEGIDAS) ==========
  router.post('/drive/export-page', ensureGoogleAuth, async (req, res) => {
    const { pagina_id } = req.body;
    try {
      const [pagina] = await pool.query(
        'SELECT p.*, c.titulo as caderno_titulo FROM paginas p JOIN cadernos c ON p.caderno_id = c.id WHERE p.id = ?',
        [pagina_id]
      );
      if (pagina.length === 0) return res.status(404).json({ error: 'Página não encontrada' });

      const { titulo, conteudo, caderno_titulo, caderno_id } = pagina[0];

      // Garantir que a pasta do caderno exista
      let folderId;
      const [folderRef] = await pool.query('SELECT folder_id FROM storage_references WHERE caderno_id = ? AND pagina_id IS NULL', [caderno_id]);
      if (folderRef.length === 0) {
        const drive = google.drive({ version: 'v3', auth: req.googleAuth });
        const folderMetadata = {
          name: caderno_titulo,
          mimeType: 'application/vnd.google-apps.folder'
        };
        const folder = await drive.files.create({
          resource: folderMetadata,
          fields: 'id'
        });
        folderId = folder.data.id;
        await pool.query(
          'INSERT INTO storage_references (caderno_id, folder_id) VALUES (?, ?)',
          [caderno_id, folderId]
        );
      } else {
        folderId = folderRef[0].folder_id;
      }

      const drive = google.drive({ version: 'v3', auth: req.googleAuth });

      // Criar subpasta com o nome da página
      const subFolderMetadata = {
        name: titulo,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [folderId]
      };
      const subFolder = await drive.files.create({
        resource: subFolderMetadata,
        fields: 'id, webViewLink'
      });
      const subFolderId = subFolder.data.id;
      const subFolderLink = subFolder.data.webViewLink;

      // Criar arquivo .txt com o conteúdo
      const fileMetadata = {
        name: `${titulo}.txt`,
        parents: [subFolderId]
      };
      const media = {
        mimeType: 'text/plain',
        body: conteudo
      };
      const file = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink'
      });

      await pool.query(
        'INSERT INTO storage_references (caderno_id, pagina_id, folder_id, file_id, link, provider) VALUES (?, ?, ?, ?, ?, ?)',
        [caderno_id, pagina_id, subFolderId, file.data.id, file.data.webViewLink, 'googledrive']
      );

      res.json({
        folderId: subFolderId,
        fileId: file.data.id,
        link: file.data.webViewLink
      });
    } catch (error) {
      console.error('Erro ao exportar página:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/drive/export-pdf', ensureGoogleAuth, async (req, res) => {
    const { pdf_id } = req.body;
    try {
      const [pdf] = await pool.query('SELECT * FROM pdfs WHERE id = ?', [pdf_id]);
      if (pdf.length === 0) return res.status(404).json({ error: 'PDF não encontrado' });
      const pdfData = pdf[0];

      const filePath = path.join(__dirname, '..', pdfData.arquivo_path);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Arquivo físico não encontrado no servidor' });
      }

      let folderId = null;
      if (pdfData.caderno_id) {
        const [folderRef] = await pool.query(
          'SELECT folder_id FROM storage_references WHERE caderno_id = ? AND pagina_id IS NULL',
          [pdfData.caderno_id]
        );

        if (folderRef.length > 0) {
          folderId = folderRef[0].folder_id;
        } else {
          const [caderno] = await pool.query('SELECT titulo FROM cadernos WHERE id = ?', [pdfData.caderno_id]);
          const cadNome = caderno[0].titulo;

          const drive = google.drive({ version: 'v3', auth: req.googleAuth });
          const folderMetadata = {
            name: cadNome,
            mimeType: 'application/vnd.google-apps.folder'
          };
          const folder = await drive.files.create({
            resource: folderMetadata,
            fields: 'id'
          });
          folderId = folder.data.id;

          await pool.query(
            'INSERT INTO storage_references (caderno_id, folder_id) VALUES (?, ?)',
            [pdfData.caderno_id, folderId]
          );
        }
      }

      const drive = google.drive({ version: 'v3', auth: req.googleAuth });
      const fileMetadata = {
        name: pdfData.titulo + '.pdf',
        parents: folderId ? [folderId] : []
      };
      const media = {
        mimeType: 'application/pdf',
        body: fs.createReadStream(filePath)
      };

      const uploadedFile = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink'
      });

      await pool.query(
        `INSERT INTO storage_references (caderno_id, pagina_id, file_id, link, provider)
         VALUES (?, ?, ?, ?, 'googledrive')`,
        [pdfData.caderno_id, null, uploadedFile.data.id, uploadedFile.data.webViewLink]
      );

      res.json({
        success: true,
        fileId: uploadedFile.data.id,
        link: uploadedFile.data.webViewLink
      });

    } catch (error) {
      console.error('Erro ao exportar PDF para o Drive:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/drive/export-notebook', ensureGoogleAuth, async (req, res) => {
    const { notebook_id } = req.body;
    try {
      const [notebook] = await pool.query('SELECT * FROM cadernos WHERE id = ?', [notebook_id]);
      if (notebook.length === 0) return res.status(404).json({ error: 'Caderno não encontrado' });
      const notebookData = notebook[0];

      const [folderRef] = await pool.query(
        'SELECT folder_id, link FROM storage_references WHERE caderno_id = ? AND pagina_id IS NULL',
        [notebook_id]
      );

      if (folderRef.length > 0) {
        return res.json({
          success: true,
          folderId: folderRef[0].folder_id,
          link: folderRef[0].link,
          existing: true
        });
      }

      const drive = google.drive({ version: 'v3', auth: req.googleAuth });
      const folderMetadata = {
        name: notebookData.titulo,
        mimeType: 'application/vnd.google-apps.folder'
      };
      const folder = await drive.files.create({
        resource: folderMetadata,
        fields: 'id, webViewLink'
      });
      const folderId = folder.data.id;
      const folderLink = folder.data.webViewLink;

      await pool.query(
        `INSERT INTO storage_references (caderno_id, folder_id, link, provider)
         VALUES (?, ?, ?, 'googledrive')`,
        [notebook_id, folderId, folderLink]
      );

      res.json({
        success: true,
        folderId,
        link: folderLink,
        existing: false
      });

    } catch (error) {
      console.error('Erro ao exportar caderno para o Drive:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/drive/page-status/:pagina_id', async (req, res) => {
    const { pagina_id } = req.params;
    try {
      const [ref] = await pool.query('SELECT * FROM storage_references WHERE pagina_id = ?', [pagina_id]);
      if (ref.length > 0) {
        res.json({ exported: true, link: ref[0].link });
      } else {
        res.json({ exported: false });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
