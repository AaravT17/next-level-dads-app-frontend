import { Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { CommunityImage } from './CommunityImage'
import { communityDetail } from '@/lib/routes'
import type { Community } from '@/types/communities'

/**
 * "7 new" on the community's photo.
 *
 * A bare count in a circle is the usual shorthand for unread, but it only works
 * where something nearby already says what is being counted — the way NavBadge
 * sits on a labelled nav icon. On a community photo the same circle is
 * ambiguous: 7 members, 7 events, 7 anything. The word is what turns it into a
 * reason to tap, so the pill carries it rather than leaving it to be guessed.
 *
 * That width is also why this is not NavBadge. That component is the glyph
 * shared by both navigations and is deliberately kept to a circle; widening it
 * for this one caller would change the chats and requests badges too.
 *
 * The separating ring is border-card, not the border-background the Chats row
 * uses: those rows sit on the page, this sits on a Card, and --card and
 * --background are different colours in every theme the app ships.
 *
 * Caps at 99+ like NavBadge, and for the same reason: the count saturates
 * server-side, so past the cap the number is "at least this many" anyway. The
 * screen-reader line is the precise one — visually "new" is doing punchy work,
 * but what is actually counted is conversations with new activity, which
 * includes an older thread somebody just replied to.
 */
function NewActivityPill({ count }: { count: number }) {
  if (count <= 0) return null

  return (
    <>
      <span
        aria-hidden
        className="absolute -top-2 -right-2 z-10 inline-flex h-5 items-center rounded-full border-2 border-card bg-primary px-1.5 text-[0.6875rem] font-semibold leading-none text-primary-foreground"
      >
        {count > 99 ? '99+' : count} new
      </span>
      <span className="sr-only">
        {count} {count === 1 ? 'conversation' : 'conversations'} with new activity since your last
        visit.
      </span>
    </>
  )
}

/**
 * A community in a list.
 *
 * Purely presentational: joining and leaving happen inside the community
 * itself, so the card no longer owns those mutations or the cache patching
 * that went with them. Tapping it opens the community.
 *
 * When the community has moved since you last opened it, the card says so three
 * ways, because each does a different job. The pill on the image is the scan
 * layer — it is what you see running an eye down twenty cards. The bolder title
 * carries the same state without relying on colour, so it survives greyscale and
 * colour-blind viewing. The count in the metadata row is the only one that says
 * what the number *means*; a bare "3" on a picture could be anything. This is the
 * Chats row's dot-plus-bold-title treatment with the words added, and the words
 * are the point of the feature — a number nobody can interpret pulls no one back.
 *
 * `new_activity_count` is threads with new posts, not posts: a thread with forty
 * replies is one thing to come back to. It is also saturated server-side, so a
 * big number means "at least this many" and NavBadge caps the glyph at 99+.
 */
const CommunityCard = ({
  id,
  name,
  description,
  image_url,
  member_count,
  role,
  new_activity_count,
}: Community) => {
  const navigate = useNavigate()
  const hasNewActivity = new_activity_count > 0

  return (
    <Card
      className="overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer h-[142px]"
      onClick={() => navigate(communityDetail(id))}
    >
      <CardContent className="p-4 flex gap-4">
        <div className="relative shrink-0">
          <CommunityImage src={image_url} name={name} size={80} />
          <NewActivityPill count={new_activity_count} />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-subhead font-heading text-foreground ${
                hasNewActivity ? 'font-bold' : 'font-semibold'
              }`}
            >
              {name}
            </h3>
            {role && (
              <Badge variant="soft" className="shrink-0">
                {role}
              </Badge>
            )}
          </div>

          {description && (
            <p className="text-body text-muted-foreground leading-relaxed line-clamp-2">
              {description}
            </p>
          )}

          <div className="flex items-center gap-2 text-caption text-muted-foreground">
            <Users aria-hidden className="w-4 h-4" />
            <span>{member_count} members</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CommunityCard
