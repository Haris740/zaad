import connect from "@/db/mongo";
import { isPartner } from "@/helpers/isAuthenticated";
import Records from "@/models/records";
import { format, toZonedTime } from "date-fns-tz";
import { NextRequest } from "next/server";

const DUBAI_TIME_ZONE = "Asia/Dubai";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await isPartner(request);

    // ✅ Read showEmployee from query params (default = true)
    const { searchParams } = new URL(request.url);
    const showEmployee = searchParams.get("showEmployee") !== "false";

    // ✅ Fetch records conditionally
    const records = await Records.find({
      published: true,
      $or: [
        { company: params.id },
        ...(showEmployee ? [{ employee: { $exists: true } }] : []),
      ],
    })
      .populate([
        { path: "createdBy", select: "username" },
        { path: "company", select: "name" },
        ...(showEmployee
          ? [
              {
                path: "employee",
                match: { company: params.id },
                select: "name documents company",
              },
            ]
          : []),
      ])
      .sort({ createdAt: -1 });

    if (!records || records.length === 0) {
      return Response.json(
        {
          message: "No records found",
          count: 0,
          records: [],
          balance: 0,
          totalIncome: 0,
          totalExpense: 0,
          totalTransactions: 0,
        },
        { status: 200 }
      );
    }

    const transformedData = records.map((record) => {
      const client = () => {
        const { company, employee, self } = record;

        if (showEmployee && employee) {
          const visaDoc = employee.documents?.find(
            (doc: any) => doc.name?.toLowerCase() === "visa"
          );

          return {
            type: "employee",
            id: employee._id,
            name: employee.name,
            docs: employee.documents?.length || 0,
            visaExpiry: visaDoc?.expiryDate || null,
            visaStatus: visaDoc?.expiryDate
              ? new Date(visaDoc.expiryDate) < new Date()
                ? "expired"
                : "active"
              : "no-visa",
          };
        }

        if (company) {
          return {
            type: "company",
            id: company._id,
            name: company.name,
          };
        }

        if (self) {
          return {
            type: "self",
            name: self,
          };
        }

        return null;
      };

      const createdAtInDubai = toZonedTime(
        record.createdAt,
        DUBAI_TIME_ZONE
      );

      return {
        id: record._id,
        type: record.type,
        client: client(),
        method: record.method,
        particular: record.particular,
        invoiceNo: record.invoiceNo,
        amount: record.amount?.toFixed(2),
        serviceFee: record.serviceFee?.toFixed(2),
        creator: record?.createdBy?.username,
        status: record.status,
        number: record.number,
        suffix: record.suffix,
        date: format(createdAtInDubai, "MMM-dd hh:mma", {
          timeZone: DUBAI_TIME_ZONE,
        }),
      };
    });

    // ✅ Totals respect showEmployee
    const allRecords = await Records.find({
      published: true,
      company: params.id,
      ...(showEmployee ? {} : { employee: { $exists: false } }),
    });

    const totalIncome = allRecords.reduce(
      (acc, record) =>
        acc +
        (record.type === "income" && record.method !== "liability"
          ? record.amount
          : 0),
      0
    );

    const totalExpense = allRecords.reduce(
      (acc, record) =>
        acc +
        (record.type === "expense" ? record.amount : 0) +
        (record.serviceFee || 0),
      0
    );

    const balance = totalIncome - totalExpense;
    const totalTransactions = allRecords.length;

    return Response.json(
      {
        count: transformedData.length,
        records: transformedData,
        balance,
        totalIncome,
        totalExpense,
        totalTransactions,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json({ error }, { status: 401 });
  }
}