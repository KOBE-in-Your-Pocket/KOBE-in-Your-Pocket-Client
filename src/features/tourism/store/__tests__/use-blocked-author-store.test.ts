import { useBlockedAuthorStore } from '../use-blocked-author-store';

describe('useBlockedAuthorStore', () => {
  beforeEach(() => {
    useBlockedAuthorStore.setState({ blockedAuthorIds: {} });
  });

  it('ブロックした投稿者をユーザー別に記録し、同じ投稿者は重複させない', () => {
    const { markBlocked } = useBlockedAuthorStore.getState();

    markBlocked('viewer-a', 'troll');
    markBlocked('viewer-a', 'troll');
    markBlocked('viewer-b', 'troll');

    expect(useBlockedAuthorStore.getState().blockedAuthorIds).toEqual({
      'viewer-a': ['troll'],
      'viewer-b': ['troll'],
    });
  });

  it('clearForUser はそのユーザーの記録だけを消す（退会時）', () => {
    useBlockedAuthorStore.setState({
      blockedAuthorIds: { 'viewer-a': ['troll'], 'viewer-b': ['spammer'] },
    });

    useBlockedAuthorStore.getState().clearForUser('viewer-a');

    expect(useBlockedAuthorStore.getState().blockedAuthorIds).toEqual({ 'viewer-b': ['spammer'] });
  });
});
