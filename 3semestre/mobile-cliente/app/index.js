import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ResizeMode, Video } from "expo-av";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LocalizedText as Text } from "../components/LocalizedText";
import { useAccessibility } from "../contexts/AccessibilityContext";
import { translateText } from "../contexts/translations";

const slides = [
  {
    tag: "NOVA EXPERIÊNCIA TOYOTA",
    title: "TOYOTA ACE",
    description:
      "Acompanhe seu veículo, pedidos, revisões e serviços em uma plataforma moderna, conectada e feita para melhorar sua jornada.",
    kind: "welcome",
  },
  {
    tag: "MODELOS",
    sectionTitle: "Escolha sua experiência",
    kind: "models",
  },
  {
    tag: "EXPERIÊNCIA DIGITAL",
    sectionTitle: "Por que usar o Toyota ACE?",
    kind: "benefits",
  },
  {
    tag: "TRADIÇÃO",
    title: "A história da Toyota",
    description:
      "Fundada em 1937, a Toyota revolucionou a indústria automotiva com inovação, qualidade e tecnologia sustentável.",
    extra:
      "Dos clássicos aos híbridos e elétricos, a marca segue transformando o futuro da mobilidade.",
    kind: "tradition",
  },
];

const models = [
  {
    name: "Hilux",
    image: require("../assets/hilux.png"),
    description: "Força, tecnologia e presença.",
  },
  {
    name: "Corolla",
    image: require("../assets/corolla.png"),
    description: "Elegância para todos os caminhos.",
  },
  {
    name: "Yaris Sedan",
    image: require("../assets/yarisseda.png"),
    description: "Conforto urbano com estilo.",
  },
];

const benefits = [
  {
    title: "Acessibilidade",
    description: "Informações importantes do seu veículo em poucos cliques.",
    icon: "accessibility-outline",
  },
  {
    title: "Conectividade",
    description: "Acompanhe pedidos, revisões e atualizações em tempo real.",
    icon: "radio-outline",
  },
  {
    title: "Experiência",
    description: "Uma jornada digital moderna, prática e conectada.",
    icon: "sparkles-outline",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const pager = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { settings } = useAccessibility();
  const slideHeight = height - insets.top - insets.bottom;

  function goToSlide(index) {
    setActiveSlide(index);
    pager.current?.scrollTo({ x: index * width, animated: true });
  }

  function openWarranty() {
    Linking.openURL("https://www.toyota.com.br/meu-toyota/garantia-toyota-10");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <Video
        source={require("./image/toyota-video.mp4")}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />
      <View pointerEvents="none" style={styles.videoOverlay} />
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setActiveSlide(Math.max(0, Math.min(slides.length - 1, index)));
        }}
        style={styles.pager}
      >
        {slides.map((slide, index) => (
          <View key={`${slide.title}-${index}`} style={{ width, height: slideHeight }}>
            <View style={styles.slide}>
              <View style={styles.slideContent}>
                <Text style={styles.tag}>{slide.tag}</Text>
                {slide.sectionTitle ? (
                  <Text style={styles.sectionTitle}>{slide.sectionTitle}</Text>
                ) : null}
                {slide.kind === "welcome" ? (
                  <>
                    <Text style={[styles.title, styles.welcomeTitle]}>
                      {slide.title}
                    </Text>
                    <Text style={styles.description}>{slide.description}</Text>
                    <View style={styles.buttons}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => router.push("/register")}
                        style={styles.primaryButton}
                      >
                        <Text style={styles.primaryButtonText}>Explorar agora</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => router.push("/login")}
                        style={styles.secondaryButton}
                      >
                        <Text style={styles.secondaryButtonText}>Já tenho conta</Text>
                      </TouchableOpacity>
                  </View>
                  </>
                ) : null}
                {slide.kind === "models" ? (
                  <View style={styles.modelList}>
                    {models.map((model) => (
                      <View key={model.name} style={styles.modelCard}>
                        <Image
                          source={model.image}
                          resizeMode="contain"
                          style={styles.modelImage}
                        />
                        <View style={styles.modelCopy}>
                          <Text style={styles.modelName}>{model.name}</Text>
                          <Text style={styles.modelDescription}>
                            {model.description}
                          </Text>
                          <Text style={styles.detailText}>Ver detalhes →</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
                {slide.kind === "benefits" ? (
                  <View style={styles.benefitList}>
                    {benefits.map((benefit) => (
                      <View key={benefit.title} style={styles.benefitCard}>
                        <View style={styles.benefitIcon}>
                          <Ionicons name={benefit.icon} size={21} color="#fff" />
                        </View>
                        <View style={styles.benefitCopy}>
                          <Text style={styles.benefitTitle}>{benefit.title}</Text>
                          <Text style={styles.benefitDescription}>
                            {benefit.description}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
                {slide.kind === "tradition" ? (
                  <>
                    <View style={styles.traditionIcon}>
                      <Ionicons name="time-outline" size={25} color="#fff" />
                    </View>
                    <Text style={styles.title}>{slide.title}</Text>
                    <Text style={styles.description}>{slide.description}</Text>
                    <Text style={[styles.description, styles.extraDescription]}>
                      {slide.extra}
                    </Text>
                    <View style={styles.signupCard}>
                      <Text style={styles.signupTitle}>
                        Sua jornada Toyota começa aqui.
                      </Text>
                      <Text style={styles.signupDescription}>
                        Crie sua conta e acompanhe tudo sobre seu veículo de forma simples.
                      </Text>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => router.push("/register")}
                        style={styles.primaryButton}
                      >
                        <Text style={styles.primaryButtonText}>Começar agora</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : null}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.nav}>
        <View style={styles.navLeft}>
          <Image source={require("../assets/logoT.png")} style={styles.navLogo} />
          <Text style={styles.navBrand}>TOYOTA ACE</Text>
        </View>
        <View style={styles.navRight}>
          <TouchableOpacity
            accessibilityRole="link"
            onPress={openWarranty}
            style={styles.warrantyButton}
          >
            <Text style={styles.warrantyText}>Garantia Toyota 10</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.push("/login")}
            style={styles.loginButton}
          >
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.pagerControls, { bottom: Math.max(42, height * 0.045) }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={translateText("Anterior", settings.language)}
          disabled={activeSlide === 0}
          onPress={() => goToSlide(activeSlide - 1)}
          style={[styles.arrowButton, activeSlide === 0 && styles.hiddenArrow]}
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.pagination}>
          {slides.map((slide, index) => (
            <TouchableOpacity
              key={`${slide.title}-dot`}
              accessibilityRole="button"
              accessibilityLabel={translateText(slide.title, settings.language)}
              accessibilityState={{ selected: activeSlide === index }}
              hitSlop={8}
              onPress={() => goToSlide(index)}
              style={[
                styles.dot,
                activeSlide === index && styles.activeDot,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={translateText("Próximo", settings.language)}
          disabled={activeSlide === slides.length - 1}
          onPress={() => goToSlide(activeSlide + 1)}
          style={[
            styles.arrowButton,
            activeSlide === slides.length - 1 && styles.hiddenArrow,
          ]}
        >
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>© {new Date().getFullYear()} Toyota do Brasil</Text>
        <Text style={styles.footerText}>Todos os direitos reservados</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#050505" },
  video: { ...StyleSheet.absoluteFillObject },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  pager: { ...StyleSheet.absoluteFillObject },
  slide: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  slideContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 26,
    paddingTop: 82,
    paddingBottom: 96,
  },
  tag: {
    color: "#ff5a5f",
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: "900",
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    maxWidth: 350,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "700",
    marginBottom: 8,
  },
  welcomeTitle: { fontSize: 58, lineHeight: 62, letterSpacing: 1 },
  modelList: { gap: 10, marginTop: 12 },
  modelCard: {
    minHeight: 88,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(10,10,10,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  modelImage: { width: 108, height: 70 },
  modelCopy: { flex: 1, paddingLeft: 9 },
  modelName: { color: "#fff", fontSize: 17, fontWeight: "900" },
  modelDescription: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  benefitList: { gap: 10, marginTop: 13 },
  benefitCard: {
    minHeight: 76,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(10,10,10,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  benefitIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d71920",
    marginRight: 12,
  },
  benefitCopy: { flex: 1 },
  benefitTitle: { color: "#fff", fontSize: 14, fontWeight: "800" },
  benefitDescription: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },
  traditionIcon: {
    width: 44,
    height: 44,
    marginBottom: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d71920",
  },
  description: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
    maxWidth: 380,
  },
  extraDescription: { marginTop: 12 },
  detailText: {
    color: "#ff5a5f",
    fontWeight: "800",
    fontSize: 10,
    marginTop: 3,
  },
  signupCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(150,15,22,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  signupTitle: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },
  signupDescription: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
    marginBottom: 12,
  },
  buttons: { marginTop: 28, gap: 12 },
  primaryButton: {
    minHeight: 52,
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d71920",
  },
  primaryButtonText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  secondaryButton: {
    minHeight: 52,
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  secondaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  nav: {
    position: "absolute",
    top: 0,
    zIndex: 5,
    width: "100%",
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(0,0,0,0.48)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navLeft: { flexDirection: "row", alignItems: "center" },
  navLogo: { width: 30, height: 30, resizeMode: "contain", marginRight: 7 },
  navBrand: { color: "#fff", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  navRight: { flexDirection: "row", alignItems: "center" },
  warrantyButton: { paddingVertical: 10, paddingHorizontal: 5 },
  warrantyText: { color: "rgba(255,255,255,0.78)", fontSize: 10 },
  loginButton: {
    marginLeft: 9,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#d71920",
  },
  loginText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  pagerControls: {
    position: "absolute",
    zIndex: 6,
    left: 18,
    right: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 3,
    alignItems: "center",
  },
  footerText: { color: "rgba(255,255,255,0.5)", fontSize: 9, lineHeight: 12 },
  arrowButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  hiddenArrow: { opacity: 0 },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  activeDot: { width: 18, backgroundColor: "#fff" },
});
