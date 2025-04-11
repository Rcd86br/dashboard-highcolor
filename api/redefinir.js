export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { email } = req.body;
  const dominiosPermitidos = ['@projetarind.com', '@highcolorpinturas.com.br'];

  if (!email || !dominiosPermitidos.some(d => email.endsWith(d))) {
    return res.status(400).json({ error: 'E-mail inválido ou não autorizado.' });
  }

  const token = Math.random().toString(36).substring(2, 12);
  const validade = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  const supabase = require('@supabase/supabase-js')
    .createClient('https://ykxoqfgotajdbhhidixo.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreG9xZmdvdGFqZGJoaWhkaXhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzkwOTExOSwiZXhwIjoyMDU5NDg1MTE5fQ.552ld2zpdzE6RuXHVep3KqNj0jVgCzZ0PFZgQWmAoRw');

  // Verificar se o e-mail está na base
  const { data: user } = await supabase
    .from('acessos_powerbi')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (!user) {
    return res.status(404).json({ error: 'E-mail não encontrado.' });
  }

  // Armazenar o token
  await supabase
    .from('tokens_recuperacao')
    .insert([{ email, token, validade }]);

  // Enviar e-mail via Resend
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer re_bRFML9Vv_57QTmSopaT7GQTQb3sSUXzMn',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'High Color Acessos <noreply@highcolor.com.br>',
      to: email,
      subject: 'Redefinição de senha – High Color',
      html: `
        <p>Você solicitou a redefinição de sua senha.</p>
        <p><a href="https://dashboard-highcolor.vercel.app/nova-senha.html?token=${token}">Clique aqui para redefinir sua senha</a></p>
        <p>Se você não solicitou isso, ignore este e-mail.</p>
      `,
    }),
  });

  if (!response.ok) {
    return res.status(500).json({ error: 'Erro ao enviar o e-mail.' });
  }

  return res.status(200).json({ message: 'E-mail enviado com sucesso.' });
}
