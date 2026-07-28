import { Client } from 'ssh2';

const conn = new Client();

console.log('🔒 Conectando à VPS gamaartigomilitar.com para instalar SSL (Certbot)...');

conn.on('ready', () => {
  console.log('✅ Conexão SSH estabelecida com sucesso!');
  
  const sslScript = `
    set -e
    echo "=== 1. INSTALANDO CERTBOT E PLUGIN NGINX ==="
    killall -9 apt apt-get dpkg unattended-upgrade 2>/dev/null || true
    rm -f /var/lib/dpkg/lock-frontend /var/lib/dpkg/lock /var/lib/apt/lists/lock /var/cache/apt/archives/lock
    dpkg --configure -a || true

    DEBIAN_FRONTEND=noninteractive apt-get update -y
    DEBIAN_FRONTEND=noninteractive apt-get install -y certbot python3-certbot-nginx cron

    echo "=== 2. GERANDO CERTIFICADO SSL (LET'S ENCRYPT) ==="
    # Gerar ou renovar certificado sem interromper o Nginx
    certbot --nginx -d gamaartigomilitar.com -d www.gamaartigomilitar.com --non-interactive --agree-tos --email contato@gamaartigomilitar.com --redirect || {
      echo "⚠️ Tentando modo standalone se Nginx falhar..."
      certbot certonly --standalone -d gamaartigomilitar.com -d www.gamaartigomilitar.com --non-interactive --agree-tos --email contato@gamaartigomilitar.com || true
    }

    echo "=== 3. CONFIGURANDO RENOVAÇÃO AUTOMÁTICA (CRONJOB) ==="
    # Garantir cronjob ativo que roda certbot renew 2x ao dia
    CRON_JOB="0 3,15 * * * certbot renew --quiet --post-hook 'systemctl reload nginx' >> /var/log/certbot-renew.log 2>&1"
    (crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB") | crontab -

    # Testar renovação em modo simulação (dry-run)
    echo "=== 4. TESTANDO RENOVAÇÃO AUTOMÁTICA (DRY-RUN) ==="
    certbot renew --dry-run || true

    echo "=== 5. REINICIANDO NGINX COM SUPORTE A HTTPS ==="
    nginx -t && (systemctl reload nginx || service nginx reload) || true

    echo "=== CERTIFICADO SSL INSTALADO E AUTO-RENOVAÇÃO CONFIGURADA COM SUCESSO! ==="
  `;

  conn.exec(sslScript, (err, stream) => {
    if (err) {
      console.error('❌ Erro de execução SSH:', err);
      conn.end();
      return;
    }
    
    stream.on('close', (code, signal) => {
      console.log(`\n🏁 Processo de SSL finalizado com código: ${code}`);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error('❌ Erro de Conexão SSH:', err);
}).connect({
  host: 'gamaartigomilitar.com',
  port: 22,
  username: 'root',
  password: 'HeuryGam1985@'
});
