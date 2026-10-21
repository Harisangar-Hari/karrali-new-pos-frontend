import { useEffect,  useState } from 'react';
import {
  Modal,
  Flex,
  Typography,
  Button,
  Table,
  Alert,
  Tag,
  Upload,
  Divider,
  
  Grid,
  App,
  Result,
} from 'antd';
import type { UploadProps } from 'antd';
import {

  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useImportProducts } from '@/hooks/queries/useProducts';
import {
  parseProductsExcel,
  downloadProductsTemplate,
  type ParseResult,
  type ParsedRow,
} from '@/utils/productExcel';
import { getErrorMessage } from '@/lib/api';
import type { ImportProductsResult } from '@/types/product';

const { useBreakpoint } = Grid;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: ImportProductsResult) => void;
}

type Step = 'upload' | 'confirm' | 'done';

export function ImportProductsModal({ open, onClose, onSuccess }: Props) {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const importMutation = useImportProducts();

  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResult, setImportResult] =
    useState<ImportProductsResult | null>(null);
  

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('upload');
      setFileName(null);
      setParsing(false);
      setParseResult(null);
      setParseError(null);
      setImportResult(null);
    }
  }, [open]);

  const handleFile = async (file: File) => {
    setParsing(true);
    setParseError(null);
    setParseResult(null);
    setFileName(file.name);
    try {
      const result = await parseProductsExcel(file);
      setParseResult(result);
      if (result.errorCount === 0 && result.validRows.length > 0) {
        setStep('confirm');
      }
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : 'Failed to parse the file',
      );
    } finally {
      setParsing(false);
    }
  };

  const uploadProps: UploadProps = {
    accept: '.xlsx,.xls,.csv',
    showUploadList: false,
    beforeUpload: (file) => {
      void handleFile(file);
      return false; // prevent auto-upload
    },
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.validRows.length === 0) return;
    try {
      const result = await importMutation.mutateAsync({
        Rows: parseResult.validRows,
      });
      setImportResult(result);
      setStep('done');
      onSuccess?.(result);
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const errorColumns = [
    {
      title: 'Row',
      dataIndex: 'rowIndex',
      key: 'rowIndex',
      width: 60,
    },
    {
      title: 'Errors',
      key: 'errors',
      render: (_: unknown, row: ParsedRow) => (
        <Flex vertical gap={2}>
          {row.errors.map((e, i) => (
            <Typography.Text key={i} type="danger" style={{ fontSize: 12 }}>
              • {e}
            </Typography.Text>
          ))}
        </Flex>
      ),
    },
  ];

  const errorRows = parseResult?.rows.filter((r) => r.errors.length > 0) ?? [];

  // ─── Render by step ──────────────────────────────────────────
  const renderUploadStep = () => (
    <Flex vertical gap={16}>
      <Alert
        type="info"
        showIcon
        message="How it works"
        description={
          <Flex vertical gap={4}>
            <span>
              Each row creates a new product, or updates the existing one if
              its <strong>Barcode</strong> matches.
            </span>
            <span>
              Categories and brands are resolved by <strong>Name</strong> —
              existing ones are reused, missing ones are created once.
            </span>
            <span>
              The whole file is imported in one transaction. If any row fails,
              nothing is saved.
            </span>
          </Flex>
        }
      />

      <Flex gap={8} wrap="wrap">
        <Button
          icon={<Download size={14} />}
          onClick={() => void downloadProductsTemplate()}
        >
          Download template
        </Button>
      </Flex>

      <Upload.Dragger {...uploadProps} disabled={parsing}>
        <Flex
          vertical
          align="center"
          justify="center"
          gap={8}
          style={{ padding: '24px 12px' }}
        >
          <FileSpreadsheet size={40} color="#0d9488" strokeWidth={1.5} />
          <Typography.Text strong style={{ fontSize: 14 }}>
            {parsing
              ? 'Parsing file…'
              : 'Click or drag an Excel file here'}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            .xlsx, .xls, or .csv · up to 1000 rows
          </Typography.Text>
        </Flex>
      </Upload.Dragger>

      {parseError && (
        <Alert
          type="error"
          showIcon
          message="Could not read the file"
          description={parseError}
        />
      )}

      {fileName && !parsing && parseResult && (
        <>
          <Divider style={{ margin: '8px 0' }} />
          <Flex vertical gap={8}>
            <Flex align="center" gap={8} wrap="wrap">
              <Typography.Text strong>{fileName}</Typography.Text>
              {parseResult.errorCount === 0 ? (
                <Tag
                  color="green"
                  icon={<CheckCircle2 size={12} />}
                  style={{ marginInlineEnd: 0 }}
                >
                  {parseResult.validRows.length} rows ready
                </Tag>
              ) : (
                <Tag
                  color="red"
                  icon={<AlertTriangle size={12} />}
                  style={{ marginInlineEnd: 0 }}
                >
                  {parseResult.errorCount} rows have errors
                </Tag>
              )}
            </Flex>

            {errorRows.length > 0 && (
              <>
                <Alert
                  type="warning"
                  showIcon
                  message={`Fix ${errorRows.length} error${errorRows.length === 1 ? '' : 's'} in the file and re-upload`}
                />
                <Table<ParsedRow>
                  rowKey="rowIndex"
                  columns={errorColumns}
                  dataSource={errorRows}
                  pagination={{ pageSize: 5, size: 'small' }}
                  size="small"
                />
              </>
            )}

            {errorRows.length === 0 && parseResult.validRows.length > 0 && (
              <Button
                type="primary"
                onClick={() => setStep('confirm')}
                icon={<ArrowRight size={14} />}
              >
                Continue to review
              </Button>
            )}
          </Flex>
        </>
      )}
    </Flex>
  );

  const renderConfirmStep = () => {
    if (!parseResult) return null;
    const s = parseResult.summary;

    return (
      <Flex vertical gap={16}>
        <Alert
          type="success"
          showIcon
          message="Ready to import"
          description={`${parseResult.validRows.length} product${parseResult.validRows.length === 1 ? '' : 's'} will be imported.`}
        />

        <Flex vertical gap={8} style={{ fontSize: 13 }}>
          <Flex justify="space-between">
            <span>Products</span>
            <strong>{s.total}</strong>
          </Flex>
          <Flex justify="space-between">
            <span>With barcode (upsert by barcode)</span>
            <strong>{s.withBarcode}</strong>
          </Flex>
          <Flex justify="space-between">
            <span>Without barcode (always create)</span>
            <strong>{s.withoutBarcode}</strong>
          </Flex>
          <Divider style={{ margin: '4px 0' }} />
          <Flex justify="space-between">
            <span>Unique categories in file</span>
            <strong>{s.categories.length}</strong>
          </Flex>
          {s.categories.length > 0 && (
            <Flex gap={4} wrap="wrap">
              {s.categories.map((c) => (
                <Tag key={c} style={{ marginInlineEnd: 0 }}>
                  {c}
                </Tag>
              ))}
            </Flex>
          )}
          {s.brands.length > 0 && (
            <>
              <Flex justify="space-between" style={{ marginTop: 8 }}>
                <span>Unique brands in file</span>
                <strong>{s.brands.length}</strong>
              </Flex>
              <Flex gap={4} wrap="wrap">
                {s.brands.map((b) => (
                  <Tag key={b} style={{ marginInlineEnd: 0 }}>
                    {b}
                  </Tag>
                ))}
              </Flex>
            </>
          )}
          {s.warehouses.length > 0 && (
            <>
              <Flex justify="space-between" style={{ marginTop: 8 }}>
                <span>Warehouses used for opening stock</span>
                <strong>{s.warehouses.join(', ')}</strong>
              </Flex>
            </>
          )}
        </Flex>

        <Alert
          type="info"
          showIcon
          message="Categories and brands will be created if they don't exist"
          description="Missing categories/brands are created once per unique name. Existing ones are reused."
        />

        <Flex justify="flex-end" gap={8}>
          <Button onClick={() => setStep('upload')}>Back</Button>
          <Button
            type="primary"
            loading={importMutation.isPending}
            onClick={handleImport}
          >
            Import {parseResult.validRows.length} product
            {parseResult.validRows.length === 1 ? '' : 's'}
          </Button>
        </Flex>
      </Flex>
    );
  };

  const renderDoneStep = () => {
    if (!importResult) return null;
    return (
      <Result
        status="success"
        title="Import complete"
        subTitle={
          <Flex vertical gap={4} style={{ fontSize: 13 }}>
            <span>
              <strong>{importResult.Created}</strong> created ·{' '}
              <strong>{importResult.Updated}</strong> updated
            </span>
            {(importResult.CategoriesCreated > 0 ||
              importResult.BrandsCreated > 0) && (
              <span style={{ color: '#888' }}>
                {importResult.CategoriesCreated} new categor
                {importResult.CategoriesCreated === 1 ? 'y' : 'ies'} ·{' '}
                {importResult.BrandsCreated} new brand
                {importResult.BrandsCreated === 1 ? '' : 's'}
              </span>
            )}
          </Flex>
        }
        extra={
          <Button type="primary" onClick={onClose}>
            Done
          </Button>
        }
      />
    );
  };

  const title = {
    upload: 'Import products from Excel',
    confirm: 'Review import',
    done: 'Import complete',
  }[step];

  return (
    <Modal
      title={title}
      open={open}
      onCancel={importMutation.isPending ? undefined : onClose}
      footer={null}
      width={isMobile ? '100%' : 640}
      destroyOnClose
      maskClosable={!importMutation.isPending}
    >
      {step === 'upload' && renderUploadStep()}
      {step === 'confirm' && renderConfirmStep()}
      {step === 'done' && renderDoneStep()}
    </Modal>
  );
}