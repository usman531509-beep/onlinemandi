const http = require('http');

async function test() {
  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/categories',
    method: 'GET'
  }, (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
      const data = JSON.parse(raw);
      if (!data.categories || data.categories.length === 0) return console.log("No categories");
      const cat = data.categories[0];
      console.log("Testing cat:", cat.id, "current fields:", cat.customFields);
      
      const payload = JSON.stringify({
         userId: "65e0f7b1e4b0bc441584cf57", // dummy, we probably need a real admin userId
         role: "admin",
         name: cat.name,
         description: cat.description,
         customFields: []
      });
      // We don't have a valid admin userId right now. 
      console.log(payload);
    });
  });
  req.end();
}
test();
