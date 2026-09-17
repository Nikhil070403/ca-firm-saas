import { useNavigate } from 'react-router-dom';

/**
 * Every user name shown in a table or feed routes to that user's profile.
 * Accepts a populated user object ({ _id, name }) or nothing — renders a
 * plain dash when unassigned so callers don't need their own fallback.
 */
export default function UserLink({ user, children }) {
  const navigate = useNavigate();
  if (!user?._id && !user?.id) return <span>—</span>;
  const id = user._id || user.id;

  return (
    <button
      type="button"
      className="entity-link"
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/users/${id}`);
      }}
    >
      {children || user.name}
    </button>
  );
}
