import CharacterCard from "../components/CharacterCard";
import { useAppStore } from "../store/appStore";

export default function Home() {
  const characters = useAppStore((s) => s.characters);
  return (
    <div className="home">
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