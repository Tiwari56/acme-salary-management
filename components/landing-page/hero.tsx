import Image from "next/image"
import ContactFormButton from "./contact-form-button"

export default function Hero() {
  return (
    <section id="hero" className="card my-8 relative overflow-hidden shadow-md">
      <div className="p-8 md:p-10 lg:p-12 flex flex-col md:flex-row items-start">
        <div className="w-full md:w-3/5 z-10">
          <h1 className="text-black dark:text-white text-4xl md:text-5xl lg:text-6xl font-medium leading-tight text-balance">
            Make your systems
            <span className="block text-[#7A7FEE] dark:text-[#7A7FEE]">work together.</span>
          </h1>
          <p className="my-6 text-sm md:text-base max-w-md text-gray-700 dark:text-gray-300">
            We build custom software, connect the tools your team uses, and automate repetitive work.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <ContactFormButton />
            <a href="#comparison" className="btn-secondary text-black dark:text-white">
              See how it works
            </a>
          </div>
        </div>

        <div className="hidden md:block md:w-2/5 md:absolute md:right-0 md:top-0 md:bottom-0 md:flex md:items-center">
          <Image
            src="/purple-circle-wave-static.png"
            alt=""
            width={500}
            height={500}
            className="w-full h-auto md:h-full md:w-auto md:object-cover md:object-left"
          />
        </div>
      </div>
    </section>
  )
}
