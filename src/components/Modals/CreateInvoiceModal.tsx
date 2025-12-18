"use client";
import { useEffect, useState } from "react";
import axios from "axios";

export default function CreateInvoiceModal({
    isOpen,
    onClose,
    onSubmit,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
}) {
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        title: "",
        purpose: "",
        client: "",
        location: "",
        date: new Date().toISOString().split("T")[0],
        remarks: "",
        suffix: "",
        invoiceNo: "",
    });

    // 🔹 Auto-fill suffix & invoice number
    useEffect(() => {
        if (!isOpen) return;

        const fetchInvoiceMeta = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get("/api/invoice/prev");

                setForm((prev) => ({
                    ...prev,
                    suffix: data?.suffix || "",
                    invoiceNo: data?.invoiceNo ? String(Number(data.invoiceNo) + 1) : "",
                }));
            } catch (err) {
                console.error("Failed to fetch invoice meta", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoiceMeta();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-999 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white dark:bg-boxdark p-6 rounded-lg w-full max-w-lg">
                <h2 className="text-lg font-semibold mb-4">Create Invoice</h2>

                <input
                    placeholder="Invoice Title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full mb-3 p-2 border rounded"
                />

                <input
                    placeholder="Purpose"
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    className="w-full mb-3 p-2 border rounded"
                />

                <input
                    placeholder="Client Name"
                    value={form.client}
                    onChange={(e) => setForm({ ...form, client: e.target.value })}
                    className="w-full mb-3 p-2 border rounded"
                />

                <input
                    placeholder="Location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full mb-3 p-2 border rounded"
                />

                {/* 🔹 Auto-filled fields (editable) */}
                <div className="flex gap-2 mb-3">
                    <input
                        placeholder="Suffix"
                        value={form.suffix}
                        onChange={(e) => setForm({ ...form, suffix: e.target.value })}
                        className="w-1/2 p-2 border rounded uppercase"
                    />
                    <input
                        type="number"
                        placeholder="Invoice No"
                        value={form.invoiceNo}
                        onChange={(e) =>
                            setForm({ ...form, invoiceNo: e.target.value })
                        }
                        className="w-1/2 p-2 border rounded"
                    />
                </div>

                <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full mb-3 p-2 border rounded"
                />

                <textarea
                    placeholder="Remarks"
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    className="w-full mb-4 p-2 border rounded"
                />

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded"
                    >
                        Cancel
                    </button>

                    <button
                        disabled={loading}
                        onClick={() => onSubmit(form)}
                        className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
                    >
                        {loading ? "Loading..." : "Create Invoice"}
                    </button>
                </div>
            </div>
        </div>
    );
}
