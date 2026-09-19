"use client";

import { Message } from "@/components/ui/Message";
import { PageHeader } from "@/components/ui/PageHeader";
import { GradingGrid } from "@/features/qcm/components/GradingGrid";
import { PublishErrors } from "@/features/qcm/components/PublishErrors";
import { QcmMetaForm } from "@/features/qcm/components/QcmMetaForm";
import { QuestionCard } from "@/features/qcm/components/QuestionCard";
import { QuestionSidebar } from "@/features/qcm/components/QuestionSidebar";
import { useQcmEditor } from "@/features/qcm/hooks/useQcmEditor";

export default function NewQcmPage() {
  const editor = useQcmEditor();
  const { draft, selectedIndex, selectedQuestion, validation, totalPoints, message, warning, showErrors } = editor;

  if (!selectedQuestion) return null;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Mes QCMs - Nouveau QCM"
        title={draft.title || "Brouillon QCM"}
        actions={
          <div className="toolbar no-print">
            <button type="button" className="secondary" onClick={editor.saveDraft}>Enregistrer brouillon</button>
            <button type="button" onClick={editor.publish}>Publier</button>
            <button type="button" className="danger" onClick={editor.cancelDraft}>Annuler</button>
          </div>
        }
      >
        <p className="muted">Autosave actif: chaque modification est gardee dans le navigateur du professeur.</p>
      </PageHeader>

      {message ? <Message>{message}</Message> : null}
      {warning ? <Message variant="warning">{warning}</Message> : null}

      <QcmMetaForm draft={draft} onChange={editor.update} />

      <div className="qcm-layout">
        <QuestionSidebar
          questions={draft.questions}
          selectedIndex={selectedIndex}
          totalPoints={totalPoints}
          onSelect={editor.setSelectedIndex}
          onAdd={editor.addQuestion}
        />
        <section className="grid">
          <QuestionCard
            question={selectedQuestion}
            index={selectedIndex}
            onChange={(question) => editor.updateQuestion(selectedIndex, question)}
            onAdd={editor.addQuestion}
            onRemove={() => editor.removeQuestion(selectedIndex)}
          />
          <GradingGrid questions={draft.questions} totalPoints={totalPoints} />
          {showErrors && validation.errors.length ? <PublishErrors errors={validation.errors} /> : null}
        </section>
      </div>
    </div>
  );
}
