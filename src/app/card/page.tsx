import { getViewerPerson } from "@/shared/lib/viewer-person";

export default async function CardPage() {
  await getViewerPerson();
  return (
    <main>
      <h1>Your sticker</h1>
    </main>
  );
}
