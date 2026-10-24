export const STATUS_INFO: Record<string, { label: string; badge: string; text: string }> = {
  draft: { label: 'Draft', badge: 'badge-blue', text: 'Not yet visible to members.' },
  forms: { label: 'Forms on sale', badge: 'badge-yellow', text: 'Nomination forms are on sale.' },
  screening: { label: 'Screening', badge: 'badge-blue', text: 'Aspirants are being screened.' },
  voting: { label: 'Voting open', badge: 'badge-green', text: 'Cast your vote now.' },
  closed: { label: 'Concluded', badge: 'badge-red', text: 'Results are published.' },
};

export const ELECTION_STAGES = ['forms', 'screening', 'voting', 'closed'];
