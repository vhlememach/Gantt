import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ChecklistTask } from "@shared/schema";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ChecklistTask | null;
  mode: "request" | "submit" | "approve";
}

export function ReviewModal({ isOpen, onClose, task, mode }: ReviewModalProps) {
  const [changes, setChanges] = useState("");
  const [submissionUrl, setSubmissionUrl] = useState("");
  const { toast } = useToast();

  const requestReviewMutation = useMutation({
    mutationFn: async ({ taskId, changes }: { taskId: string; changes: string }) => {
      const response = await apiRequest('POST', `/api/checklist-tasks/${taskId}/request-review`, { changes });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
      toast({ title: "Review requested successfully" });
      onClose();
      setChanges("");
    },
    onError: () => {
      toast({ title: "Failed to request review", variant: "destructive" });
    }
  });

  const submitReviewMutation = useMutation({
    mutationFn: async ({ taskId, submissionUrl }: { taskId: string; submissionUrl: string }) => {
      const response = await apiRequest('POST', `/api/checklist-tasks/${taskId}/submit-review`, { submissionUrl });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
      toast({ title: "Review submitted successfully" });
      onClose();
      setSubmissionUrl("");
    },
    onError: () => {
      toast({ title: "Failed to submit review", variant: "destructive" });
    }
  });

  const approveReviewMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest('POST', `/api/checklist-tasks/${taskId}/approve-review`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
      toast({ title: "Review approved successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to approve review", variant: "destructive" });
    }
  });

  const requestNextVersionMutation = useMutation({
    mutationFn: async ({ taskId, changes }: { taskId: string; changes: string }) => {
      const response = await apiRequest('POST', `/api/checklist-tasks/${taskId}/request-review`, { changes });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
      toast({ title: "Next version requested successfully" });
      onClose();
      setChanges("");
    },
    onError: () => {
      toast({ title: "Failed to request next version", variant: "destructive" });
    }
  });

  const handleSubmit = () => {
    if (!task) return;

    if (mode === "request") {
      if (!changes.trim()) {
        toast({ title: "Please enter changes required", variant: "destructive" });
        return;
      }
      requestReviewMutation.mutate({ taskId: task.id, changes });
    } else if (mode === "submit") {
      if (!submissionUrl.trim()) {
        toast({ title: "Please enter submission URL", variant: "destructive" });
        return;
      }
      submitReviewMutation.mutate({ taskId: task.id, submissionUrl });
    } else if (mode === "approve") {
      if (changes.trim() && (task?.currentVersion || 2) < 10) {
        // Request next version instead of approving
        requestNextVersionMutation.mutate({ taskId: task.id, changes });
      } else {
        // Approve and complete
        approveReviewMutation.mutate(task.id);
      }
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "request":
        return `Request Review - V${(task?.currentVersion || 1) + 1}`;
      case "submit":
        return `Submit V${task?.currentVersion || 2}`;
      case "approve":
        return "Approve Review";
      default:
        return "Review";
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case "request":
        return `Request V${(task?.currentVersion || 1) + 1}`;
      case "submit":
        return "Submit for Approval";
      case "approve":
        return "Approve";
      default:
        return "Save";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Task: {task?.taskTitle}
            </Label>
          </div>

          {mode === "request" && (
            <div>
              <Label htmlFor="changes" className="text-sm font-medium">
                Changes Required
              </Label>
              <Textarea
                id="changes"
                value={changes}
                onChange={(e) => setChanges(e.target.value)}
                placeholder="Describe the changes needed for this version..."
                className="mt-1"
                rows={4}
              />
            </div>
          )}

          {mode === "submit" && (
            <>
              {task?.reviewChanges && (
                <div>
                  <Label className="text-sm font-medium">
                    Requested Changes:
                  </Label>
                  <div className="mt-1 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {task.reviewChanges}
                    </p>
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="submissionUrl" className="text-sm font-medium">
                  V{task?.currentVersion || 2} Submission URL
                </Label>
                <Input
                  id="submissionUrl"
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
            </>
          )}

          {mode === "approve" && (
            <div className="space-y-3">
              {task?.reviewChanges && (
                <div>
                  <Label className="text-sm font-medium">
                    Requested Changes:
                  </Label>
                  <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {task.reviewChanges}
                    </p>
                  </div>
                </div>
              )}
              
              {task?.reviewSubmissionUrl && (
                <div>
                  <Label className="text-sm font-medium">
                    Submitted URL:
                  </Label>
                  <div className="mt-1 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <a 
                      href={task.reviewSubmissionUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {task.reviewSubmissionUrl}
                    </a>
                  </div>
                </div>
              )}

              {/* Option to request next version instead of approving */}
              {(task?.currentVersion || 2) < 10 && (
                <div>
                  <Label htmlFor="nextVersionChanges" className="text-sm font-medium">
                    Or request V{(task?.currentVersion || 2) + 1} (optional):
                  </Label>
                  <Textarea
                    id="nextVersionChanges"
                    value={changes}
                    onChange={(e) => setChanges(e.target.value)}
                    placeholder="Describe additional changes needed for next version..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          {mode === "approve" && changes.trim() && (task?.currentVersion || 2) < 10 ? (
            <Button 
              onClick={handleSubmit}
              disabled={requestReviewMutation.isPending || submitReviewMutation.isPending || approveReviewMutation.isPending || requestNextVersionMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-6 px-2"
            >
              Request V{(task?.currentVersion || 2) + 1}
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={requestReviewMutation.isPending || submitReviewMutation.isPending || approveReviewMutation.isPending || requestNextVersionMutation.isPending}
              className="text-xs h-6 px-2"
            >
              {getButtonText()}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}