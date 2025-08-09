import CharacterCard from "../components/CharacterCard";
import { useAppStore } from "../store/appStore";

export default function Home() {
  const characters = useAppStore((s) => s.characters);
  return (
    <div className="home">
      <div className="home__header">
        <div className="home__title">AI 캐릭터 선택</div>
        <div className="home__subtitle">관심 있는 캐릭터를 선택해 대화를 시작해 보세요.</div>
      </div>
      <div className="grid">
        {characters.map((c) => (
          <CharacterCard key={c.id} character={c} />
        ))}
      </div>
    </div>
  );
} 