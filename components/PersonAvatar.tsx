// Stand-in face for a member without a photo: a drawn person in a circle, chosen by gender
export default function PersonAvatar({ gender, className }: { gender?: string; className?: string }) {
  const g = (gender || '').toLowerCase();
  const female = g.startsWith('f');
  const male = g.startsWith('m');
  const id = female ? 'pa-f' : male ? 'pa-m' : 'pa-n';
  return (
    <svg className={`person-avatar${className ? ` ${className}` : ''}`} viewBox="0 0 100 100" role="img" aria-label="No photo yet">
      <defs><clipPath id={id}><circle cx="50" cy="50" r="50" /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        {female ? (
          <>
            <rect width="100" height="100" fill="#d4e8fb" />
            {/* hair falling behind the shoulders */}
            <path d="M28 46c0-16 10-27 22-27s22 11 22 27v26H28z" fill="#f2c66b" />
            <rect x="44" y="56" width="12" height="12" rx="4" fill="#f4c3a1" />
            {/* blazer over a red top */}
            <path d="M16 100c0-20 14-32 34-32s34 12 34 32z" fill="#2f5d82" />
            <path d="M42 68h16l-8 16z" fill="#e57373" />
            <path d="M42 68l8 16-12 16H30z M58 68l-8 16 12 16h8z" fill="#3b6f99" opacity="0.6" />
            <ellipse cx="50" cy="45" rx="13.5" ry="15.5" fill="#fbd8bf" />
            {/* fringe */}
            <path d="M36 44c0-13 7-20 15-20s14 6 14 16c-6-1-12-5-15-11-3 7-8 12-14 15z" fill="#f2c66b" />
          </>
        ) : male ? (
          <>
            <rect width="100" height="100" fill="#2f8fe6" />
            <rect x="44" y="56" width="12" height="12" rx="4" fill="#f0b98d" />
            {/* suit, white shirt and red tie */}
            <path d="M16 100c0-20 14-32 34-32s34 12 34 32z" fill="#5b6066" />
            <path d="M41 68h18l-9 22z" fill="#ffffff" />
            <path d="M48 70h4l2 14-4 6-4-6z" fill="#e53935" />
            <path d="M41 68l9 22-10 10H32z M59 68l-9 22 10 10h8z" fill="#474c52" />
            <ellipse cx="50" cy="45" rx="13.5" ry="15.5" fill="#f7c89b" />
            {/* short dark hair */}
            <path d="M36 44c-1-13 6-21 14-21s15 7 14 21c-2-6-4-9-7-10-6 2-13 2-18-1-2 3-3 6-3 11z" fill="#3a3a3a" />
          </>
        ) : (
          <>
            <rect width="100" height="100" fill="#2c3a33" />
            <circle cx="50" cy="42" r="16" fill="#6f8478" />
            <path d="M16 100c0-20 14-34 34-34s34 14 34 34z" fill="#6f8478" />
          </>
        )}
      </g>
    </svg>
  );
}
