const gameData = [
  {
    team1: 'Ace Warriors',
    team2: 'Net Crushers',
    date: '02-11-2025',
    time: '20:00',
    team1Wins: 18,
    team1Losses: 3,
    team2Wins: 14,
    team2Losses: 6,
    status: 'upcoming',
    score: '',
    lineup: {
      team1: [
        'Player C1', 'Player C2', 'Player C3', 'Player C4', 'Player C5', 'Player C6',
        'Player C7', 'Player C8', 'Player C9', 'Player C10', 'Player C11', 'Player C12',
      ],
      team2: [
        'Player D1', 'Player D2', 'Player D3', 'Player D4', 'Player D5', 'Player D6',
        'Player D7', 'Player D8', 'Player D9', 'Player D10', 'Player D11', 'Player D12',
      ],
    },
  },
  {
    team1: 'Spike Kings',
    team2: 'Net Defenders',
    date: '02-11-2025',
    time: '19:00',
    team1Wins: 10,
    team1Losses: 10,
    team2Wins: 8,
    team2Losses: 12,
    status: 'upcoming',
    score: '',
    lineup: {
      team1: [
        'Player E1', 'Player E2', 'Player E3', 'Player E4', 'Player E5', 'Player E6',
        'Player E7', 'Player E8', 'Player E9', 'Player E10', 'Player E11', 'Player E12',
      ],
      team2: [
        'Player F1', 'Player F2', 'Player F3', 'Player F4', 'Player F5', 'Player F6',
        'Player F7', 'Player F8', 'Player F9', 'Player F10', 'Player F11', 'Player F12',
      ],
    },
  },
  {
    team1: 'Spikers United',
    team2: 'Block Masters',
    date: '29-10-2025',
    time: '20:00',
    status: 'past',
    score: '3-1',
    lineup: {
      team1: [
        'Player G1', 'Player G2', 'Player G3', 'Player G4', 'Player G5', 'Player G6',
        'Player G7', 'Player G8', 'Player G9', 'Player G10', 'Player G11', 'Player G12',
      ],
      team2: [
        'Player H1', 'Player H2', 'Player H3', 'Player H4', 'Player H5', 'Player H6',
        'Player H7', 'Player H8', 'Player H9', 'Player H10', 'Player H11', 'Player H12',
      ],
    },
  },
  {
    team1: 'Ace Warriors',
    team2: 'Net Crushers',
    date: '01-11-2025',
    time: '18:00',
    status: 'ongoing',
    score: '2-2',
    lineup: {
      team1: [
        'Player I1', 'Player I2', 'Player I3', 'Player I4', 'Player I5', 'Player I6',
        'Player I7', 'Player I8', 'Player I9', 'Player I10', 'Player I11', 'Player I12',
      ],
      team2: [
        'Player J1', 'Player J2', 'Player J3', 'Player J4', 'Player J5', 'Player J6',
        'Player J7', 'Player J8', 'Player J9', 'Player J10', 'Player J11', 'Player J12',
      ],
    },
  },
  {
    team1: 'Spike Kings',
    team2: 'Net Defenders',
    date: '04-11-2025',
    time: '17:00',
    status: 'upcoming',
    score: '',
    lineup: {
      team1: ['Player G1', 'Player G2', 'Player G3', 'Player G4', 'Player G5', 'Player G6'],
      team2: ['Player H1', 'Player H2', 'Player H3', 'Player H4', 'Player H5', 'Player H6'],
    },
  },
  {
    team1: 'Ace Warriors',
    team2: 'Spike Kings',
    date: '05-11-2025',
    time: '19:00',
    status: 'upcoming',
    score: '',
    lineup: {
      team1: ['Player I1', 'Player I2', 'Player I3', 'Player I4', 'Player I5', 'Player I6'],
      team2: ['Player J1', 'Player J2', 'Player J3', 'Player J4', 'Player J5', 'Player J6'],
    },
  },
  {
    team1: 'Net Crushers',
    team2: 'Block Masters',
    date: '06-11-2025',
    time: '18:00',
    status: 'upcoming',
    score: '',
    lineup: {
      team1: ['Player K1', 'Player K2', 'Player K3', 'Player K4', 'Player K5', 'Player K6'],
      team2: ['Player L1', 'Player L2', 'Player L3', 'Player L4', 'Player L5', 'Player L6'],
    },
  },
  {
    team1: 'Spikers United',
    team2: 'Ace Warriors',
    date: '07-11-2025',
    time: '20:00',
    status: 'upcoming',
    score: '',
    lineup: {
      team1: ['Player M1', 'Player M2', 'Player M3', 'Player M4', 'Player M5', 'Player M6'],
      team2: ['Player N1', 'Player N2', 'Player N3', 'Player N4', 'Player N5', 'Player N6'],
    },
  },
  {
    team1: 'Spike Kings',
    team2: 'Net Crushers',
    date: '08-11-2025',
    time: '17:30',
    status: 'upcoming',
    score: '',
    lineup: {
      team1: ['Player O1', 'Player O2', 'Player O3', 'Player O4', 'Player O5', 'Player O6'],
      team2: ['Player P1', 'Player P2', 'Player P3', 'Player P4', 'Player P5', 'Player P6'],
    },
  },
  {
    team1: 'Block Masters',
    team2: 'Net Defenders',
    date: '09-11-2025',
    time: '18:30',
    status: 'upcoming',
    score: '',
    lineup: {
      team1: ['Player Q1', 'Player Q2', 'Player Q3', 'Player Q4', 'Player Q5', 'Player Q6'],
      team2: ['Player R1', 'Player R2', 'Player R3', 'Player R4', 'Player R5', 'Player R6'],
    },
  },
  {
    team1: 'Spikers United',
    team2: 'Net Crushers',
    date: '10-11-2025',
    time: '19:30',
    status: 'upcoming',
    score: '',
    lineup: {
      team1: ['Player S1', 'Player S2', 'Player S3', 'Player S4', 'Player S5', 'Player S6'],
      team2: ['Player T1', 'Player T2', 'Player T3', 'Player T4', 'Player T5', 'Player T6'],
    },
  },
  {
    team1: 'Ace Warriors',
    team2: 'Block Masters',
    date: '11-11-2025',
    time: '20:30',
    status: 'upcoming',
    score: '',
    lineup: {
      team1: ['Player U1', 'Player U2', 'Player U3', 'Player U4', 'Player U5', 'Player U6'],
      team2: ['Player V1', 'Player V2', 'Player V3', 'Player V4', 'Player V5', 'Player V6'],
    },
  },
  {
    team1: 'Spike Kings',
    team2: 'Spikers United',
    date: '12-11-2025',
    time: '18:00',
    status: 'upcoming',
    score: '',
    lineup: {
      team1: ['Player W1', 'Player W2', 'Player W3', 'Player W4', 'Player W5', 'Player W6'],
      team2: ['Player X1', 'Player X2', 'Player X3', 'Player X4', 'Player X5', 'Player X6'],
    },
  },
  {
    team1: 'Net Defenders',
    team2: 'Ace Warriors',
    date: '13-11-2025',
    time: '19:00',
    status: 'upcoming',
    score: '',
    lineup: {
      team1: ['Player Y1', 'Player Y2', 'Player Y3', 'Player Y4', 'Player Y5', 'Player Y6'],
      team2: ['Player Z1', 'Player Z2', 'Player Z3', 'Player Z4', 'Player Z5', 'Player Z6'],
    },
  },
];

export default gameData;
