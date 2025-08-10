import CharacterCard from "../components/CharacterCard";
import { useAppStore } from "../store/appStore";
import homeBackground from "../assets/images/img_background_home.png";

export default function Home() {
  const characters = useAppStore((s) => s.characters);
  const currentUser = useAppStore((s) => s.currentUser);

  return (
    <div className="home">
      <div className="service-header" style={{ backgroundImage: `url(${homeBackground})` }}>
        <h1 className="service-title">Fictalk</h1>
        <p className="service-message">
          Hi <strong>{currentUser.username}</strong>, Whisper to your hero beneath the moonlight.
        </p>
      </div>

      <hr className="divider" />

      <div className="home__header">
        <div className="home__title">Select AI Character</div>
        <div className="home__subtitle">Choose a character you're interested in and start a conversation.</div>
      </div>
      <div className="grid">
        {characters.map((c) => (
          <CharacterCard key={c.id} character={c} />
        ))}
      </div>
    </div>
  );
} 