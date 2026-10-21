import type { ImportProductRow } from '@/types/product';

export interface ParsedRow {
    /** Excel row number (header is row 1, so first data row is 2). */
    rowIndex: number;
    data: ImportProductRow | null;
    errors: string[];
}

export interface ParseResult {
    rows: ParsedRow[];
    validRows: ImportProductRow[];
    errorCount: number;
    summary: {
        total: number;
        withBarcode: number;
        withoutBarcode: number;
        categories: string[];
        brands: string[];
        warehouses: string[];
    };
}

const COLUMNS = [
    'Name',
    'SKU',
    'Barcode',
    'CategoryName',
    'BrandName',
    'Price',
    'CostPrice',
    'Unit',
    'Description',
    'Discount',
    'TaxRate',
    'ReorderLevel',
    'WarrantyMonths',
    'IsActive',
    'InitialQty',
    'InitialWarehouseCode',
] as const;

function toNumber(v: unknown): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function toInt(v: unknown): number | null {
    const n = toNumber(v);
    return n === null ? null : Math.floor(n);
}

function toBool(v: unknown): boolean | null {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'boolean') return v;
    const s = String(v).toLowerCase().trim();
    if (s === 'true' || s === '1' || s === 'yes' || s === 'y') return true;
    if (s === 'false' || s === '0' || s === 'no' || s === 'n') return false;
    return null;
}

/**
 * Parse the uploaded Excel file into ImportProductRow[] with per-row
 * validation. Duplicates (barcode/SKU) are caught here, before the
 * upload — the backend also checks, but this gives instant feedback.
 */
export async function parseProductsExcel(file: File): Promise<ParseResult> {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('File has no sheets');

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new Error('Could not read the first sheet');

    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
        raw: false,
    });

    if (rawRows.length === 0) {
        throw new Error('File has no data rows');
    }

    const parsed: ParsedRow[] = [];
    const seenBarcodes = new Map<string, number>();
    const seenSkus = new Map<string, number>();

    let rowNum = 1; // header is row 1, first data row is row 2
    for (const raw of rawRows) {
        rowNum++;
        const errors: string[] = [];

        const name = String(raw['Name'] ?? '').trim();
        const sku = String(raw['SKU'] ?? '').trim();
        const barcode = String(raw['Barcode'] ?? '').trim();
        const categoryName = String(raw['CategoryName'] ?? '').trim();
        const brandName = String(raw['BrandName'] ?? '').trim();
        const unit = String(raw['Unit'] ?? 'pcs').trim() || 'pcs';
        const description = String(raw['Description'] ?? '').trim();
        const warehouseCode = String(raw['InitialWarehouseCode'] ?? '').trim();

        const price = toNumber(raw['Price']);
        const costPrice = toNumber(raw['CostPrice']);
        const discount = toNumber(raw['Discount']);
        const taxRate = toNumber(raw['TaxRate']);
        const reorder = toInt(raw['ReorderLevel']);
        const warranty = toInt(raw['WarrantyMonths']);
        const initialQty = toInt(raw['InitialQty']);
        const isActive = toBool(raw['IsActive']);

        if (!name) errors.push('Name is required');
        if (!categoryName) errors.push('CategoryName is required');
        if (price === null || price < 0)
            errors.push('Price must be a non-negative number');
        if (costPrice === null || costPrice < 0)
            errors.push('CostPrice must be a non-negative number');

        if (barcode) {
            const existing = seenBarcodes.get(barcode);
            if (existing !== undefined) {
                errors.push(
                    `Duplicate barcode "${barcode}" (also on row ${existing})`,
                );
            } else {
                seenBarcodes.set(barcode, rowNum);
            }
        }
        if (sku) {
            const existing = seenSkus.get(sku);
            if (existing !== undefined) {
                errors.push(`Duplicate SKU "${sku}" (also on row ${existing})`);
            } else {
                seenSkus.set(sku, rowNum);
            }
        }

        if (initialQty !== null && initialQty > 0 && !warehouseCode) {
            errors.push('InitialWarehouseCode is required when InitialQty > 0');
        }

        const data: ImportProductRow | null =
            errors.length === 0
                ? {
                    Name: name,
                    SKU: sku || undefined,
                    Barcode: barcode || undefined,
                    CategoryName: categoryName,
                    BrandName: brandName || undefined,
                    Price: price!,
                    CostPrice: costPrice!,
                    Unit: unit,
                    Description: description || undefined,
                    Discount: discount ?? undefined,
                    TaxRate: taxRate ?? undefined,
                    ReorderLevel: reorder ?? undefined,
                    WarrantyMonths: warranty ?? undefined,
                    IsActive: isActive ?? undefined,
                    InitialQty: initialQty ?? undefined,
                    InitialWarehouseCode: warehouseCode || undefined,
                }
                : null;

        parsed.push({ rowIndex: rowNum, data, errors });
    }

    const validRows = parsed
        .filter((r) => r.data)
        .map((r) => r.data as ImportProductRow);
    const errorCount = parsed.filter((r) => r.errors.length > 0).length;

    const categories = Array.from(
        new Set(validRows.map((r) => r.CategoryName)),
    );
    const brands = Array.from(
        new Set(
            validRows.map((r) => r.BrandName).filter((b): b is string => !!b),
        ),
    );
    const warehouses = Array.from(
        new Set(
            validRows
                .map((r) => r.InitialWarehouseCode)
                .filter((w): w is string => !!w),
        ),
    );

    return {
        rows: parsed,
        validRows,
        errorCount,
        summary: {
            total: validRows.length,
            withBarcode: validRows.filter((r) => !!r.Barcode).length,
            withoutBarcode: validRows.filter((r) => !r.Barcode).length,
            categories,
            brands,
            warehouses,
        },
    };
}

export async function downloadProductsTemplate(): Promise<void> {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet([
        [...COLUMNS],
        [
            'Example Product 1',
            'SKU-001',
            '8901234567890',
            'Beverages',
            'Coca-Cola',
            250,
            180,
            'pcs',
            'Sample description',
            0,
            0,
            10,
            0,
            'TRUE',
            100,
            'MAIN',
        ],
        [
            'Example Product 2',
            'SKU-002',
            '8901234567891',
            'Snacks',
            '',
            150,
            100,
            'pcs',
            '',
            0,
            0,
            20,
            0,
            'TRUE',
            50,
            'MAIN',
        ],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'karrali-products-template.xlsx');
}