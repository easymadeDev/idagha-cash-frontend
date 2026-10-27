// The association's official executive positions, in order of rank
export const OFFICIAL_POSITIONS = [
  'Chairman',
  'Vice Chairman',
  'General Secretary',
  'Assistant Secretary',
  'Financial Secretary',
  'Treasurer',
  'Welfare Officer',
  'Public Relations Officer (PRO)',
  'Provost',
  'Adviser / Patron',
];

// Rank of a position for sorting; unknown titles go last
export const positionRank = (title = '') => {
  const i = OFFICIAL_POSITIONS.findIndex((p) => p.toLowerCase() === title.trim().toLowerCase());
  return i === -1 ? OFFICIAL_POSITIONS.length : i;
};

// Every official seat in rank order, filled by its officer or marked vacant; other titles follow
export const withVacancies = (team: any[] = []) => {
  const seats = OFFICIAL_POSITIONS.flatMap((title) => {
    const held = team.filter((x) => positionRank(x.position) === positionRank(title));
    return held.length ? held : [{ _id: `vacant-${title}`, position: title, name: 'Vacant', vacant: true }];
  });
  return [...seats, ...team.filter((x) => positionRank(x.position) === OFFICIAL_POSITIONS.length)];
};
