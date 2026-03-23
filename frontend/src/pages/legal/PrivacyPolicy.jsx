import React from 'react';
import './Legal.css';

const PrivacyPolicy = () => {
  return (
    <div className="legal-container">
      <h1>Política de Privacidade</h1>
      <p><strong>Última atualização:</strong> {new Date().toLocaleDateString()}</p>

      <section>
        <h2>1. Informações que coletamos</h2>
        <p>O Academic Binder coleta as seguintes informações quando você utiliza nossa plataforma:</p>
        <ul>
          <li><strong>Dados de cadastro:</strong> nome, e-mail (quando você faz login com o Google).</li>
          <li><strong>Conteúdo gerado pelo usuário:</strong> cadernos, anotações, podcasts, PDFs e outros arquivos enviados.</li>
          <li><strong>Dados de uso:</strong> informações sobre como você interage com a aplicação (páginas visitadas, tempo de uso).</li>
          <li><strong>Arquivos de mídia:</strong> áudios, vídeos e imagens que você faz upload para geração de anotações.</li>
        </ul>
      </section>

      <section>
        <h2>2. Como usamos suas informações</h2>
        <p>Utilizamos os dados coletados para:</p>
        <ul>
          <li>Fornecer e manter os serviços do Academic Binder.</li>
          <li>Processar suas anotações e gerar conteúdo com inteligência artificial.</li>
          <li>Melhorar a experiência do usuário e desenvolver novas funcionalidades.</li>
          <li>Garantir a segurança e integridade da plataforma.</li>
          <li>Exportar seus arquivos para o Google Drive (quando autorizado).</li>
        </ul>
      </section>

      <section>
        <h2>3. Compartilhamento de dados</h2>
        <p>Seus dados não são vendidos ou alugados para terceiros. Podemos compartilhar informações quando:</p>
        <ul>
          <li>Você autoriza explicitamente (ex.: exportação para Google Drive).</li>
          <li>Exigido por lei ou para proteger direitos legais.</li>
          <li>Com prestadores de serviços que nos auxiliam na operação (ex.: OpenAI, AWS, Google Cloud).</li>
        </ul>
        <p>Os serviços de IA (OpenAI, AWS Polly) podem processar o conteúdo que você envia para gerar anotações e podcasts. Consulte as políticas de privacidade desses provedores para mais detalhes.</p>
      </section>

      <section>
        <h2>4. Armazenamento e segurança</h2>
        <p>Seus dados são armazenados em servidores seguros (TiDB Cloud, PPDRIVE). Utilizamos medidas de segurança como criptografia em trânsito (SSL/TLS) e controles de acesso para proteger suas informações.</p>
      </section>

      <section>
        <h2>5. Seus direitos</h2>
        <p>Você pode solicitar a exclusão de seus dados entrando em contato conosco. Os arquivos exportados para o Google Drive permanecem sob seu controle direto.</p>
      </section>

      <section>
        <h2>6. Alterações nesta política</h2>
        <p>Podemos atualizar esta Política de Privacidade periodicamente. Recomendamos que você revise esta página regularmente. A data da última atualização será indicada no topo da página.</p>
      </section>

      <section>
        <h2>7. Contato</h2>
        <p>Se tiver dúvidas sobre esta Política de Privacidade, entre em contato pelo e-mail: <a href="mailto:privacy@academicbinder.com">privacy@academicbinder.com</a>.</p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;