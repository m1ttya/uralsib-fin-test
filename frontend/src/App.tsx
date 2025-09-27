import TestPlayer from './components/TestPlayer';
import { mockTests } from './data/mockTests';

function App() {
  const test = mockTests[0]; // можно выбрать по URL или категории позже

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4">
      <header className="w-full max-w-2xl mb-6 px-6">
        {/* Логотип теперь будет внутри карточки */}
      </header>

      <main className="w-full max-w-2xl px-6 mt-4 mx-auto">
        <TestPlayer test={test} />
      </main>

      <footer className="mt-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Банк Уралсиб
      </footer>
    </div>
  );
}

export default App;