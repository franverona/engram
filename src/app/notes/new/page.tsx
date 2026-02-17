import { NoteForm } from "@/components/note-form";

export default function NewNotePage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Create a Note</h1>
      <NoteForm />
    </div>
  );
}
