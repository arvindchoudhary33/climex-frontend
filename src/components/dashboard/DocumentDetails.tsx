import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface DocumentDetailsProps {
  documents: any[];
}

export function DocumentDetails({ documents }: DocumentDetailsProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "N/A";
      }
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "N/A";
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Topics</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">{doc.display_title}</TableCell>
              <TableCell>{formatDate(doc.docdt)}</TableCell>
              <TableCell>
                {doc.teratopic?.split(",").slice(0, 2).join(", ") || "N/A"}
                {doc.teratopic?.split(",").length > 2 && "..."}
              </TableCell>
              <TableCell>
                {doc.pdfurl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(doc.pdfurl, "_blank")}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    View PDF
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
