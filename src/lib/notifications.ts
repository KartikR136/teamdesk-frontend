import { useToast } from "@/components/ui/Toast";

export function useNotify() {
  const { toast } = useToast();

  return {
    success: (title: string, description?: string) =>
      toast({ title, description, variant: "success" }),
    error: (title: string, description?: string) =>
      toast({ title, description, variant: "danger" }),
  };
}
