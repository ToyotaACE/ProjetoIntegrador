import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ShieldCheck,
  Wifi,
  Sparkles,
} from "lucide-react";

import logoT from "@/assets/logoT.png";
import toyotaCar from "@/assets/hilux.png";
import corolla from "@/assets/corolla.png";
import yaris from "@/assets/yarisseda.png";
import bgVideo from "@/assets/toyota-video.mp4";

const LandingPage = () => {
  const navigate = useNavigate();

  const cars = [
    {
      name: "Hilux",
      image: toyotaCar,
      subtitle: "Força, tecnologia e presença.",
    },
    {
      name: "Corolla",
      image: corolla,
      subtitle: "Elegância para todos os caminhos.",
    },
    {
      name: "Yaris Sedan",
      image: yaris,
      subtitle: "Conforto urbano com estilo.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logoT}
              alt="Toyota Logo"
              className="w-10 h-10 object-contain"
            />

            <span className="text-lg font-bold tracking-[0.25em]">
              TOYOTA ACE
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <a href="#modelos" className="hover:text-white transition">
              Modelos
            </a>
            <a href="#experiencia" className="hover:text-white transition">
              Experiência
            </a>
            <a href="#historia" className="hover:text-white transition">
              História
            </a>
            <a
  href="https://www.toyota.com.br/meu-toyota/garantia-toyota-10"
  target="_blank"
  rel="noopener noreferrer"
  className="hover:text-white transition"
>
  Garantia Toyota 10
</a>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/login")}
              className="text-white hover:bg-white/10"
            >
              Login
            </Button>

            <Button
              onClick={() => navigate("/cadastro")}
              className="bg-white text-black hover:bg-white/80"
            >
              Começar
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO COM VÍDEO DE FUNDO */}
      <section className="relative min-h-screen flex items-center pt-24 overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={bgVideo}
          autoPlay
          muted
          loop
          playsInline
        />

        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/20" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.5em] text-zinc-500 mb-4">
              Nova experiência Toyota
            </p>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-none mb-6">
              Toyota
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">
                ACE
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/80 max-w-xl mb-8 leading-relaxed">
              Acompanhe seu veículo, pedidos, revisões e serviços em uma
              plataforma moderna, conectada e feita para melhorar sua jornada.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/cadastro")}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Explorar agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/login")}
                className="border-white/30 text-white bg-white/5 hover:bg-white/10"
              >
                Já tenho conta
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/60 text-xs uppercase tracking-[0.35em]">
          Role para explorar
        </div>
      </section>

      {/* MODELOS */}
      <section id="modelos" className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-zinc-500 uppercase tracking-[0.35em] text-xs mb-3">
              Modelos
            </p>

            <h2 className="text-3xl md:text-5xl font-black">
              Escolha sua experiência
            </h2>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {cars.map((car) => (
            <div
              key={car.name}
              className="group bg-white/[0.04] border border-white/10 rounded-3xl p-6 text-left hover:bg-white/[0.08] transition overflow-hidden"
            >
              <img
                src={car.image}
                alt={car.name}
                className="w-full h-44 object-contain group-hover:scale-105 transition duration-500"
              />

              <h3 className="text-2xl font-bold mt-6">{car.name}</h3>

              <p className="text-white/60 mt-2">{car.subtitle}</p>

            </div>
          ))}
        </div>
      </section>

      {/* PILARES */}
      <section id="experiencia" className="bg-white text-black py-20">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-zinc-700 uppercase tracking-[0.35em] text-xs mb-3">
            Experiência digital
          </p>

          <h2 className="text-3xl md:text-5xl font-black mb-12">
            Por que usar o Toyota ACE?
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-neutral-100 hover:bg-neutral-200 transition">
              <ShieldCheck className="h-10 w-10 text-zinc-700 dark:text-zinc-300 mb-6" />

              <h3 className="text-2xl font-bold mb-3">Acessibilidade</h3>

              <p className="text-neutral-600">
                Informações importantes do seu veículo em poucos cliques, com
                navegação simples e intuitiva.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-neutral-100 hover:bg-neutral-200 transition">
              <Wifi className="h-10 w-10 text-zinc-700 dark:text-zinc-300 mb-6" />

              <h3 className="text-2xl font-bold mb-3">Conectividade</h3>

              <p className="text-neutral-600">
                Acompanhe pedidos, revisões, atualizações e serviços em tempo
                real, direto pela plataforma.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-neutral-100 hover:bg-neutral-200 transition">
              <Sparkles className="h-10 w-10 text-zinc-700 dark:text-zinc-300 mb-6" />

              <h3 className="text-2xl font-bold mb-3">Experiência</h3>

              <p className="text-neutral-600">
                Uma jornada digital moderna, prática e pensada para deixar o
                cliente mais próximo da marca.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HISTÓRIA */}
      <section id="historia" className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-zinc-500 uppercase tracking-[0.35em] text-xs mb-3">
              Tradição
            </p>

            <h2 className="text-3xl md:text-5xl font-black mb-6">
              A história da Toyota
            </h2>
          </div>

          <div className="text-white/70 leading-relaxed space-y-4">
            <p>
              Fundada em 1937, a Toyota revolucionou a indústria automotiva com
              inovação, qualidade e tecnologia sustentável.
            </p>

            <p>
              Dos modelos clássicos aos veículos híbridos e elétricos, a marca
              segue transformando o futuro da mobilidade com responsabilidade,
              confiança e excelência.
            </p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto rounded-[2rem] bg-gradient-to-r from-red-700 to-red-500 p-10 md:p-16 text-center overflow-hidden relative">
          <div className="absolute inset-0 bg-black/10" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black mb-6">
              Sua jornada Toyota começa aqui.
            </h2>

            <p className="text-white/85 max-w-2xl mx-auto mb-8">
              Crie sua conta e acompanhe tudo sobre seu veículo de forma
              simples, rápida e conectada.
            </p>

            <Button
              size="lg"
              onClick={() => navigate("/cadastro")}
              className="bg-white text-black hover:bg-white/80"
            >
              Começar agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-6 text-center text-white/50 text-sm">
        © {new Date().getFullYear()} Toyota do Brasil — Todos os direitos
        reservados
      </footer>
    </div>
  );
};

export default LandingPage;