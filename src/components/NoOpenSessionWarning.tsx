import { Alert, Button, Flex } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useMyOpenSession } from '@/hooks/queries/useCashSession';

interface Props {
  /** What's being blocked, e.g. "Recording a cash movement" */
  context: string;
  /** Optional callback that triggers a refetch after returning from POS. */
  onRetry?: () => void;
}

/**
 * Shown inside a form when the current user has no open cash drawer.
 * The submit button should also be disabled — this component is the
 * explanation, not the only guard.
 */
export function NoOpenSessionWarning({ context, onRetry }: Props) {
  const navigate = useNavigate();
  const { refetch } = useMyOpenSession();

  const handleRetry = async () => {
    await refetch();
    onRetry?.();
  };

  return (
    <Alert
      type="warning"
      showIcon
      message="No open cash drawer"
      description={
        <Flex vertical gap={8}>
          <span>
            {context} must be recorded against an open session. Otherwise
            the entry won't reconcile when you close the drawer. Open a
            session from the POS, then come back.
          </span>
          <Flex gap={8} wrap="wrap">
            <Button
              size="small"
              type="primary"
              onClick={() => navigate('/pos')}
            >
              Open drawer from POS
            </Button>
            <Button size="small" onClick={handleRetry}>
              Already opened — retry
            </Button>
          </Flex>
        </Flex>
      }
      style={{ marginBottom: 16 }}
    />
  );
}