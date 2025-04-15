const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Gametime Backend is running!');
});

app.get('/standings', (req, res) => {
  const standings = [
    { name: 'Equipo A', points: 30 },
    { name: 'Equipo B', points: 25 },
    { name: 'Equipo C', points: 20 },
  ];
  res.json(standings);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
