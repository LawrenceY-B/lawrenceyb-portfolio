import { Cursor, Loader, ParticleCanvas } from "@/components/Chrome";
import { TopBar } from "@/components/Nav";
import {
  About,
  Build,
  Contact,
  Footer,
  Hero,
  Numbers,
  OffTheClock,
  SelectedWork,
  Stack,
} from "@/components/sections";
import { projects } from "@/content/projects";
import { InspectOverlay } from "@/features/inspect/Inspect";
import { Experience } from "@/features/motion/Experience";
import { getPublicRepoCount } from "@/lib/github";
import { site } from "@/lib/site";

export default async function Home() {
  // Runs at build time (static export); the number refreshes on every deploy.
  const repos = await getPublicRepoCount(site.githubUser);
  const year = new Date().getFullYear();

  return (
    <>
      <Loader />
      <ParticleCanvas />
      <TopBar />
      <main>
        <Hero />
        <Build />
        <SelectedWork projects={projects} />
        <Numbers repos={repos} />
        <About />
        <OffTheClock />
        <Stack />
        <Contact />
        <Footer year={year} />
      </main>
      <InspectOverlay />
      <Cursor />
      <Experience />
    </>
  );
}
