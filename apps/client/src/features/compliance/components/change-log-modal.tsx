import {
  Button,
  Center,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Text,
  TextInput,
} from "@mantine/core";
import { IconDownload, IconPlus, IconSearch } from "@tabler/icons-react";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useChangeSetsQuery } from "@/features/compliance/queries/change-set-query.ts";
import { exportChangeSets } from "@/features/compliance/services/change-set-service.ts";
import { downloadChangeSetsCsv } from "@/features/compliance/utils/compliance.utils.ts";
import { changeLogModalAtom } from "@/features/compliance/atoms/compliance-atoms.ts";
import ChangeSetItem from "@/features/compliance/components/change-set-item.tsx";
import ChangeSetFormModal from "@/features/compliance/components/change-set-form-modal.tsx";

interface ChangeLogModalProps {
  pageId: string;
  canEdit?: boolean;
}

export default function ChangeLogModal({
  pageId,
  canEdit,
}: ChangeLogModalProps) {
  const { t } = useTranslation();
  const [opened, setOpened] = useAtom(changeLogModalAtom);

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [isExporting, setIsExporting] = useState(false);

  const [formOpened, { open: openForm, close: closeForm }] =
    useDisclosure(false);
  const [correctsId, setCorrectsId] = useState<string | undefined>(undefined);

  const scope = useMemo(
    () => (opened ? { pageId } : {}),
    [opened, pageId],
  );

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useChangeSetsQuery(scope, debouncedSearch);

  const changeSets = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  const handleNew = () => {
    setCorrectsId(undefined);
    openForm();
  };

  const handleCorrect = (changeSetId: string) => {
    setCorrectsId(changeSetId);
    openForm();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const all = await exportChangeSets({ pageId }, debouncedSearch);
      downloadChangeSetsCsv(all, {
        date: t("Date"),
        system: t("System"),
        ticket: t("Ticket reference"),
        reason: t("Reason"),
        requestedBy: t("Requested by"),
        performedBy: t("Performed by"),
        change: t("What was changed"),
        detail: t("Detail"),
        correction: t("Correction"),
        yes: t("Yes"),
        no: t("No"),
      });
    } catch {
      notifications.show({ message: t("Export failed"), color: "red" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
    <Modal.Root
      size={900}
      opened={opened}
      onClose={() => setOpened(false)}
      aria-label={t("Change log")}
    >
      <Modal.Overlay />
      <Modal.Content style={{ overflow: "hidden" }}>
        <Modal.Header>
          <Modal.Title>
            <Text size="md" fw={500}>
              {t("Change log")}
            </Text>
          </Modal.Title>
          <Modal.CloseButton aria-label={t("Close")} />
        </Modal.Header>
        <Modal.Body>
          <Group justify="space-between" mb="sm" wrap="wrap" gap="xs">
            <TextInput
              placeholder={t("Search change log")}
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              style={{ flex: 1, minWidth: 200 }}
            />
            <Group gap="xs">
              <Button
                variant="default"
                leftSection={<IconDownload size={16} />}
                onClick={handleExport}
                loading={isExporting}
                disabled={changeSets.length === 0}
              >
                {t("Export CSV")}
              </Button>
              {canEdit && (
                <Button leftSection={<IconPlus size={16} />} onClick={handleNew}>
                  {t("New change")}
                </Button>
              )}
            </Group>
          </Group>

          <ScrollArea h={520} scrollbarSize={5} type="scroll">
            {isLoading ? (
              <Center py="md">
                <Loader size="sm" />
              </Center>
            ) : changeSets.length === 0 ? (
              <Text size="sm" c="dimmed">
                {debouncedSearch
                  ? t("No matching changes.")
                  : t("No changes documented yet.")}
              </Text>
            ) : (
              <>
                {changeSets.map((changeSet) => (
                  <ChangeSetItem
                    key={changeSet.id}
                    changeSet={changeSet}
                    canEdit={canEdit}
                    onCorrect={handleCorrect}
                  />
                ))}
                {hasNextPage && (
                  <Group justify="center" my="sm">
                    <Button
                      variant="default"
                      size="xs"
                      onClick={() => fetchNextPage()}
                      loading={isFetchingNextPage}
                    >
                      {t("Load more")}
                    </Button>
                  </Group>
                )}
              </>
            )}
          </ScrollArea>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>

      <ChangeSetFormModal
        opened={formOpened}
        onClose={closeForm}
        scope={{ pageId }}
        correctsId={correctsId}
      />
    </>
  );
}
