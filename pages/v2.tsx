// Direct link to the glass dashboard, whatever skin is selected
import GlassHome from '../components/GlassHome';

export async function getStaticProps() {
  const { getClassPhotos } = await import('../lib/classPhotos');
  return { props: { classPhotos: getClassPhotos() } };
}

export default GlassHome;
