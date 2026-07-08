fetch('http://localhost:3000/api/groups', { method: 'DELETE' }).then(r => r.json()).then(console.log);
