export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
      <main className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
          Hello, World!
        </h1>
        <p className="text-xl text-white/90 mb-8">
          Welcome to my first Next.js app
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="https://github.com/rubyamyeen"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-full hover:scale-105 transition-transform shadow-lg"
          >
            GitHub
          </a>
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-white/20 text-white font-semibold rounded-full border-2 border-white hover:bg-white/30 transition-colors"
          >
            Learn More
          </a>
        </div>
      </main>
    </div>
  );
}
