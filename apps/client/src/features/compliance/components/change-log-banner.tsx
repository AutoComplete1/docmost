import { Alert, Button, Group, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useChangeLogInfoQuery } from "@/features/compliance/queries/change-set-query.ts";
import { changeLogDirtyAtom } from "@/features/compliance/atoms/compliance-atoms.ts";
import { pageEditorAtom } from "@/features/editor/atoms/editor-atoms.ts";
import ChangeSetFormModal from "@/features/compliance/components/change-set-form-modal.tsx";

interface ChangeLogBannerProps {
  pageId: string;
  canEdit?: boolean;
}

export default function ChangeLogBanner({
  pageId,
  canEdit,
}: ChangeLogBannerProps) {
  const { t } = useTranslation();
  const { data } = useChangeLogInfoQuery({ pageId });
  const [opened, { open, close }] = useDisclosure(false);
  const editor = useAtomValue(pageEditorAtom);
  const [dirtyMap, setDirty] = useAtom(changeLogDirtyAtom);

  const enabled = !!data?.enabled;
  const dirty = !!dirtyMap[pageId];

  // Flag the page the moment the user actually types, so the banner shows
  // immediately on the first keystroke — without waiting for the autosave that
  // bumps the page's updatedAt (which is what the server-side check relies on).
  useEffect(() => {
    if (!enabled || !editor) return;

    const handler = ({ transaction }) => {
      if (!transaction.docChanged || !editor.isFocused) return;
      setDirty((prev) => (prev[pageId] ? prev : { ...prev, [pageId]: true }));
    };

    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
    };
  }, [enabled, editor, pageId, setDirty]);

  if (!enabled || (!data?.undocumented && !dirty)) {
    return null;
  }

  return (
    <Alert
      color="red"
      variant="light"
      radius="sm"
      mb="md"
      icon={<IconAlertTriangle size={18} />}
      styles={{ wrapper: { alignItems: "center" } }}
    >
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Text size="sm" style={{ flex: 1, minWidth: 0 }}>
          {t(
            "This page was changed without a change log entry. Please document the change.",
          )}
        </Text>
        {canEdit && (
          <Button size="xs" variant="light" color="red" onClick={open}>
            {t("Document change")}
          </Button>
        )}
      </Group>

      <ChangeSetFormModal opened={opened} onClose={close} scope={{ pageId }} />
    </Alert>
  );
}
