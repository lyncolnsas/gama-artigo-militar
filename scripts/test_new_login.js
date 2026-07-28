async function testLogin() {
  console.log('🔑 Testando login com novas credenciais exclusivas...');
  try {
    const res = await fetch('https://gamaartigomilitar.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@gamaartigomilitar.com',
        password: '22101844bc'
      })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Resposta:', data);
  } catch (err) {
    console.error('Erro:', err);
  }
}

testLogin();
