import { useRouter } from "expo-router";
import { Video, ResizeMode } from "expo-av";
import {
  Dimensions,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { LocalizedText as Text } from "../components/LocalizedText";

const { width, height } = Dimensions.get("window");

export default function LandingPage() {
  const router = useRouter();

  const cars = [
    {
      name: "Hilux",
      image: require("../assets/hilux.png"),
      subtitle: "Força, tecnologia e presença.",
    },
    {
      name: "Corolla",
      image: require("../assets/corolla.png"),
      subtitle: "Elegância para todos os caminhos.",
    },
    {
      name: "Yaris Sedan",
      image: require("../assets/yarisseda.png"),
      subtitle: "Conforto urbano com estilo.",
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          <View style={styles.navLeft}>
            <Image source={require("../assets/logoT.png")} style={styles.logo} />
            <Text style={styles.logoText}>TOYOTA ACE</Text>
          </View>

          <View style={styles.navRight}>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL("https://www.toyota.com.br/meu-toyota/garantia-toyota-10")
              }
            >
              <Text style={styles.navText}>Garantia Toyota 10</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.hero}>
          <Video
            source={require("./image/toyota-video.mp4")}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
          />

          <View style={styles.overlay} />

          <View style={styles.heroContent}>
            <Text style={styles.heroTag}>NOVA EXPERIÊNCIA TOYOTA</Text>

            <Text style={styles.heroTitle}>
              Toyota{"\n"}
              <Text style={styles.heroTitleSoft}>ACE</Text>
            </Text>

            <Text style={styles.heroDescription}>
              Acompanhe seu veículo, pedidos, revisões e serviços em uma
              plataforma moderna, conectada e feita para melhorar sua jornada.
            </Text>

            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/register")}>
              <Text style={styles.primaryButtonText}>Explorar agora</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/login")}>
              <Text style={styles.secondaryButtonText}>Já tenho conta</Text>
            </TouchableOpacity>
          </View>

          
        </View>

        <View style={styles.modelsSection}>
          <Text style={styles.sectionTag}>MODELOS</Text>
          <Text style={styles.sectionTitle}>Escolha sua experiência</Text>

          {cars.map((car) => (
            <View key={car.name} style={styles.carCard}>
              <Image source={car.image} style={styles.carImage} />
              <Text style={styles.carName}>{car.name}</Text>
              <Text style={styles.carSubtitle}>{car.subtitle}</Text>
              <Text style={styles.detailsText}>Ver detalhes →</Text>
            </View>
          ))}
        </View>

        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTagRed}>EXPERIÊNCIA DIGITAL</Text>
          <Text style={styles.benefitsTitle}>Por que usar o Toyota ACE?</Text>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>🛡️</Text>
            <Text style={styles.benefitTitle}>Acessibilidade</Text>
            <Text style={styles.benefitText}>
              Informações importantes do seu veículo em poucos cliques.
            </Text>
          </View>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>📡</Text>
            <Text style={styles.benefitTitle}>Conectividade</Text>
            <Text style={styles.benefitText}>
              Acompanhe pedidos, revisões e atualizações em tempo real.
            </Text>
          </View>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>✨</Text>
            <Text style={styles.benefitTitle}>Experiência</Text>
            <Text style={styles.benefitText}>
              Uma jornada digital moderna, prática e conectada.
            </Text>
          </View>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTag}>TRADIÇÃO</Text>
          <Text style={styles.sectionTitle}>A história da Toyota</Text>

          <Text style={styles.historyText}>
            Fundada em 1937, a Toyota revolucionou a indústria automotiva com
            inovação, qualidade e tecnologia sustentável.
          </Text>

          <Text style={styles.historyText}>
            Dos clássicos aos híbridos e elétricos, a marca segue transformando
            o futuro da mobilidade.
          </Text>
        </View>

        <View style={styles.ctaWrapper}>
          <View style={styles.ctaBox}>
            <Text style={styles.ctaTitle}>Sua jornada Toyota começa aqui.</Text>
            <Text style={styles.ctaText}>
              Crie sua conta e acompanhe tudo sobre seu veículo de forma simples.
            </Text>

            <TouchableOpacity style={styles.ctaButton} onPress={() => router.push("/register")}>
              <Text style={styles.ctaButtonText}>Começar agora</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footer}>
          © {new Date().getFullYear()} Toyota do Brasil — Todos os direitos reservados
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#050505" },
  container: { flex: 1, backgroundColor: "#050505" },

  nav: {
    position: "absolute",
    top: 0,
    zIndex: 20,
    width: "100%",
    minHeight: 78,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  navLeft: { flexDirection: "row", alignItems: "center" },
  logo: { width: 34, height: 34, resizeMode: "contain", marginRight: 8 },
  logoText: { color: "#fff", fontSize: 13, fontWeight: "900", letterSpacing: 3 },

  navRight: { flexDirection: "row", alignItems: "center" },
  navText: { color: "rgba(255,255,255,0.75)", fontSize: 11, marginRight: 14 },
  loginText: { color: "#ef4444", fontSize: 12, fontWeight: "700" },

  hero: {
    height: height * 0.92,
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#000",
  },

  video: { ...StyleSheet.absoluteFillObject },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.62)",
  },

  heroContent: {
    zIndex: 5,
    paddingHorizontal: 24,
    marginTop: 60,
  },

  heroTag: {
    color: "#ef4444",
    fontSize: 11,
    letterSpacing: 4,
    fontWeight: "800",
    marginBottom: 18,
  },

  heroTitle: {
    color: "#fff",
    fontSize: 58,
    lineHeight: 62,
    fontWeight: "900",
  },

  heroTitleSoft: { color: "rgba(255,255,255,0.55)" },

  heroDescription: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 18,
    maxWidth: width * 0.86,
  },

  primaryButton: {
    marginTop: 28,
    backgroundColor: "#dc2626",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },

  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  secondaryButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },

  secondaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  scrollText: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    letterSpacing: 3,
    zIndex: 6,
  },

  modelsSection: { paddingHorizontal: 20, paddingVertical: 42, backgroundColor: "#050505" },
  sectionTag: { color: "#ef4444", fontSize: 11, letterSpacing: 4, fontWeight: "800", marginBottom: 10 },
  sectionTitle: { color: "#fff", fontSize: 32, lineHeight: 38, fontWeight: "900", marginBottom: 24 },

  carCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 26,
    padding: 20,
    marginBottom: 18,
  },

  carImage: { width: "100%", height: 150, resizeMode: "contain" },
  carName: { color: "#fff", fontSize: 25, fontWeight: "900", marginTop: 12 },
  carSubtitle: { color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 6, marginBottom: 16 },
  detailsText: { color: "#ef4444", fontWeight: "800", fontSize: 14 },

  benefitsSection: { backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 42 },
  sectionTagRed: { color: "#dc2626", fontSize: 11, letterSpacing: 4, fontWeight: "800", marginBottom: 10 },
  benefitsTitle: { color: "#050505", fontSize: 31, lineHeight: 37, fontWeight: "900", marginBottom: 24 },

  benefitCard: {
    backgroundColor: "#f1f1f1",
    borderRadius: 24,
    padding: 22,
    marginBottom: 14,
  },

  benefitIcon: { fontSize: 28, marginBottom: 12 },
  benefitTitle: { color: "#111", fontSize: 22, fontWeight: "900", marginBottom: 8 },
  benefitText: { color: "#555", fontSize: 14, lineHeight: 21 },

  historySection: { paddingHorizontal: 20, paddingVertical: 42, backgroundColor: "#050505" },
  historyText: { color: "rgba(255,255,255,0.68)", fontSize: 15, lineHeight: 24, marginBottom: 14 },

  ctaWrapper: { paddingHorizontal: 20, paddingBottom: 42, backgroundColor: "#050505" },
  ctaBox: { backgroundColor: "#dc2626", borderRadius: 28, padding: 26, alignItems: "center" },
  ctaTitle: { color: "#fff", fontSize: 30, lineHeight: 36, fontWeight: "900", textAlign: "center", marginBottom: 14 },
  ctaText: { color: "rgba(255,255,255,0.85)", fontSize: 15, lineHeight: 22, textAlign: "center", marginBottom: 22 },
  ctaButton: { backgroundColor: "#fff", paddingVertical: 14, paddingHorizontal: 26, borderRadius: 14 },
  ctaButtonText: { color: "#000", fontWeight: "900", fontSize: 15 },

  footer: {
    textAlign: "center",
    color: "rgba(255,255,255,0.45)",
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: "#050505",
    fontSize: 12,
  },
});