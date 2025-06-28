// Archivo para centralizar todos los modelos
const Usuario = require('./Usuario');
const Liga = require('./Liga');
const Equipo = require('./Equipo');
const Partido = require('./Partido');
const PlayerStats = require('./PlayerStats');
const GameStats = require('./GameStats');
const MatchImage = require('./MatchImage');
const Noticia = require('./Noticia');
const AuditLog = require('./AuditLog');

module.exports = {
  Usuario,
  Liga,
  Equipo,
  Partido,
  PlayerStats,
  GameStats,
  MatchImage,
  Noticia,
  AuditLog
};
