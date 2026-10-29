import MemberFigure from './MemberFigure';
import { initials } from '../lib/member';

// Phones: an officer drawn as a person (same figure as the members page), position tag and
// call / WhatsApp buttons under the name. Hidden on wider screens, where each page keeps its own card.
export default function ExecFigure({ x, gender, contact = true }: { x: any; gender?: string; contact?: boolean }) {
  const wa = x.phone ? `https://wa.me/${x.phone.replace(/\D/g, '').replace(/^0/, '234')}` : '';
  return (
    <div className={`mf-figure ex-figure${x.vacant ? ' is-vacant' : ''}`}>
      <MemberFigure id={`ex-${x._id}`} photo={x.photo} gender={gender || x.gender} initials={x.vacant ? '?' : initials(x.name)} />
      <div className="mf-caption">
        <b>{x.name}</b>
        <em>{x.position}</em>
        {contact && x.phone && (
          <div className="ex-contact">
            <a href={`tel:${x.phone}`} aria-label={`Call ${x.name}`}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2" strokeLinejoin="round" /></svg>
            </a>
            <a href={wa} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${x.name}`}>
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.1 1.4z" /></svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
