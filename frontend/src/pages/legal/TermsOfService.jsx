import React from 'react';
import './Legal.css';

const TermsOfService = () => {
  return (
    <div className="legal-container">
      <h1>Termos de Serviço</h1>
      <p><strong>Última atualização:</strong> {new Date().toLocaleDateString()}</p>

      <section>
        <h2>1. Aceitação dos Termos</h2>
        <p>Ao acessar ou utilizar o Academic Binder, você concorda em cumprir estes Termos de Serviço. Se não concordar, não utilize a plataforma.</p>
      </section>

      <section>
        <h2>2. Descrição do serviço</h2>
        <p>O Academic Binder é uma plataforma de organização acadêmica que permite a criação de cadernos, anotações, geração de podcasts e gerenciamento de arquivos. O serviço utiliza inteligência artificial para auxiliar na transcrição, resumo e geração de conteúdo.</p>
      </section>

      <section>
        <h2>3. Conta e segurança</h2>
        <p>Você é responsável por manter a confidencialidade de suas credenciais de login (quando aplicável) e por todas as atividades que ocorrerem em sua conta. O Academic Binder não se responsabiliza por perdas decorrentes do uso não autorizado de sua conta.</p>
      </section>

      <section>
        <h2>4. Propriedade intelectual</h2>
        <p>Você mantém a propriedade de todo o conteúdo que cria na plataforma (cadernos, anotações, arquivos enviados). O Academic Binder não reivindica direitos sobre seu conteúdo. No entanto, ao usar o serviço, você nos concede uma licença para processar e armazenar esse conteúdo com a finalidade de fornecer os serviços.</p>
        <p>A interface, código e design da plataforma são propriedade do Academic Binder e não podem ser copiados ou reproduzidos sem autorização.</p>
      </section>

      <section>
        <h2>5. Uso adequado</h2>
        <p>Você concorda em não utilizar a plataforma para:</p>
        <ul>
          <li>Enviar conteúdo ilegal, difamatório, obsceno ou que viole direitos de terceiros.</li>
          <li>Realizar atividades que possam danificar ou sobrecarregar os servidores.</li>
          <li>Tentar acessar áreas não autorizadas do sistema.</li>
        </ul>
        <p>O Academic Binder se reserva o direito de suspender ou encerrar contas que violem estas regras.</p>
      </section>

      <section>
        <h2>6. Limitação de responsabilidade</h2>
        <p>O Academic Binder é fornecido “no estado em que se encontra”, sem garantias de que o serviço será ininterrupto ou livre de erros. Não nos responsabilizamos por danos diretos ou indiretos decorrentes do uso ou da impossibilidade de uso da plataforma.</p>
      </section>

      <section>
        <h2>7. Modificações do serviço</h2>
        <p>Podemos alterar ou descontinuar funcionalidades a qualquer momento, com ou sem aviso prévio. Não seremos responsáveis por qualquer modificação, suspensão ou interrupção do serviço.</p>
      </section>

      <section>
        <h2>8. Lei aplicável</h2>
        <p>Estes Termos são regidos pelas leis do Brasil. Qualquer disputa será resolvida no foro da comarca de São Paulo.</p>
      </section>

      <section>
        <h2>9. Contato</h2>
        <p>Para dúvidas sobre estes Termos, entre em contato pelo e-mail: <a href="mailto:support@academicbinder.com">support@academicbinder.com</a>.</p>
      </section>
    </div>
  );
};

export default TermsOfService;