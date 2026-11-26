import Header from "@/components/landing-page/header"
import StartProject from "@/components/landing-page/start-project"
import Footer from "@/components/landing-page/footer"

export const metadata = {
  title: "Discuss your project | Harvynex Technologies",
  description:
    "Tell Harvynex Technologies what you want to build, connect or automate and send us your project enquiry.",
}

export default function StartPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#111111]">
      <Header />
      <StartProject />
      <Footer />
    </main>
  )
}
