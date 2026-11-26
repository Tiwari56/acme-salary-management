import ProjectForm from "./project-form"

export default function StartProject() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#111111]">
      <div className="mb-8 text-center pt-8">
        <h2 className="text-black dark:text-white text-3xl md:text-5xl font-medium">
          Discuss your <span className="text-[#7A7FEE]">project</span>
        </h2>
      </div>
      <ProjectForm />
    </div>
  )
}
