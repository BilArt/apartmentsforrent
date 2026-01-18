import SearchPanel from "../../components/SearchPanel/SearchPanel";

export default function ListingsPage() {
  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 80 }}>
      <SearchPanel />

      {/* ниже: результаты (пока заглушка) */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ margin: 0 }}>Результати</h2>
      </div>
    </div>
  );
}
