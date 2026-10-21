import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { Send } from 'lucide-react'
import { BOARDS, getLocalizedBoardName } from '../Forum/constants'
import { sanitizeInput } from '../Forum/utils/sanitize'
import { truncateText } from '../Forum/utils/formatters'
import { socialApiService } from './api'
import SocialAvatar, { getSocialIdentity } from './SocialAvatar'
import * as s from './Social.css.ts'

const SOCIAL_TOPIC_CHIPS = [
  { value: '#Theory', labelKey: 'feed.theory' },
  { value: '#Reading', labelKey: 'feed.reading' },
  { value: '#Organizing', labelKey: 'feed.organizing' },
  { value: '#History', labelKey: 'feed.history' },
]

function SocialComposer({
  composerId,
  user,
  profile,
  mode = 'social',
  defaultBoardSlug = '',
  suggestedTopics = SOCIAL_TOPIC_CHIPS,
  parentId = null,
  quotedPost = null,
  onCancelQuote,
  onCreated,
}) {
  const { t } = useTranslation()
  const isBoardComposer = mode === 'board' || Boolean(defaultBoardSlug)
  const initialDestination = isBoardComposer ? `board:${defaultBoardSlug || BOARDS[0].slug}` : 'timeline'
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState(initialDestination)
  const [visibility, setVisibility] = useState('public')
  const [anonymous, setAnonymous] = useState(isBoardComposer)
  const [anonymousName, setAnonymousName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedBoardSlug = destination.startsWith('board:') ? destination.replace('board:', '') : ''
  const boardMode = isBoardComposer || Boolean(selectedBoardSlug)
  const isLoggedIn = Boolean(user?.id)
  const canPost = isLoggedIn || boardMode
  const effectiveAnonymous = boardMode && (!isLoggedIn || anonymous)
  const topicChips = [...(suggestedTopics || []).map((topic) => typeof topic === 'string' ? { value: topic } : topic), ...SOCIAL_TOPIC_CHIPS]
    .filter((topic, index, items) => items.findIndex((item) => item.value === topic.value) === index)
  const quotedIdentity = quotedPost ? getSocialIdentity(quotedPost, t) : null

  useEffect(() => {
    setDestination(isBoardComposer ? `board:${defaultBoardSlug || BOARDS[0].slug}` : 'timeline')
  }, [defaultBoardSlug, isBoardComposer])

  useEffect(() => {
    setAnonymous(isBoardComposer)
  }, [isBoardComposer])

  const reset = () => {
    setContent('')
    setTitle('')
    setAnonymous(isBoardComposer)
    setAnonymousName('')
    setError('')
  }

  const appendTopic = (topic) => {
    setContent((value) => {
      const spacer = value && !value.endsWith(' ') ? ' ' : ''
      return `${value}${spacer}${topic} `
    })
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canPost || loading) return

    const cleanedContent = sanitizeInput(content.trim())
    const cleanedTitle = sanitizeInput(title.trim())

    if (cleanedContent.length < 1) {
      setError(t('social.postRequired'))
      return
    }
    if (boardMode && cleanedTitle && cleanedTitle.length < 3) {
      setError(t('social.boardTitleMin'))
      return
    }

    setLoading(true)
    setError('')
    try {
      const post = await socialApiService.createPost({
        content: cleanedContent,
        title: boardMode ? cleanedTitle || null : null,
        boardSlug: selectedBoardSlug || null,
        parentId,
        quotedPostId: quotedPost?.id || null,
        isAnonymous: effectiveAnonymous,
        anonymousName,
        visibility: boardMode ? 'public' : visibility,
      }, user?.id || null)
      reset()
      onCreated?.(post)
    } catch (err) {
      setError(err.message || t('social.couldNotPost'))
    } finally {
      setLoading(false)
    }
  }

  if (!canPost) {
    return (
      <div id={composerId} className={`${s.composer} ${s.socialComposer}`}>
        <div className={s.composerGrid}>
          <SocialAvatar item={{ username: t('social.guest') }} />
          <div className={s.composerBody}>
            <div className={s.guestComposerPrompt}>
              <div className={s.guestComposerText}>
                <strong>{t('social.loginToUse')}</strong>
                <span>{t('social.loginToUseDesc')}</span>
              </div>
              <Link href="/login" className={s.submitButton}>{t('nav.login')}</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form id={composerId} className={`${s.composer} ${boardMode ? s.boardComposer : s.socialComposer}`} onSubmit={handleSubmit}>
      <div className={s.composerGrid}>
        <SocialAvatar item={effectiveAnonymous ? { is_anonymous: true, anonymous_name: anonymousName } : (profile || { username: user?.email })} />
        <div className={s.composerBody}>
          {boardMode && !parentId && (
            <div className={s.boardComposerHeader}>
              <strong>{t('social.newThread')}</strong>
              <span>/{selectedBoardSlug || defaultBoardSlug || BOARDS[0].slug}/</span>
            </div>
          )}

          {boardMode && !parentId && (
            <input
              className={s.composerTitleInput}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                setError('')
              }}
              maxLength={200}
              placeholder={t('social.threadTitle')}
              disabled={loading}
            />
          )}
          <textarea
            className={s.composerTextarea}
            value={content}
            onChange={(event) => {
              setContent(event.target.value)
              setError('')
            }}
            placeholder={parentId ? t('social.replyPlaceholder') : boardMode ? t('social.startThread') : t('social.whatsHappening')}
            aria-label={boardMode ? t('social.boardPostBody') : t('social.socialPostBody')}
            disabled={loading}
          />

          {!boardMode && !parentId && (
            <div className={s.socialComposerToolbar}>
              <div className={s.topicChipGroup} aria-label={t('social.topicShortcuts')}>
                <span className={s.composerToolLabel}>{t('social.signalTags')}</span>
                {topicChips.map((topic) => (
                  <button
                    key={topic.value}
                    type="button"
                    className={s.topicChip}
                    onClick={() => appendTopic(topic.value)}
                    disabled={loading}
                  >
                    {topic.labelKey ? `#${t(topic.labelKey)}` : topic.value}
                  </button>
                ))}
              </div>
              <span className={s.characterCount}>{content.length}/2000</span>
            </div>
          )}

          {quotedPost && (
            <div className={s.embeddedPost}>
              <div className={s.identityLine}>
                <span className={s.displayName}>{quotedIdentity.name}</span>
                <span className={s.handle}>{quotedIdentity.handle}</span>
                <button type="button" className={s.boardBadge} onClick={onCancelQuote}>{t('common.clear')}</button>
              </div>
              {quotedPost.title && <h4 className={s.postTitle}>{quotedPost.title}</h4>}
              <p className={s.postContent}>{truncateText(quotedPost.content, 180)}</p>
            </div>
          )}

          <div className={s.composerControls}>
            <div className={s.controlGroup}>
              {boardMode && !parentId && (
                <label className={s.selectLabel}>
                  <span>{t('forum.boardsLabel')}</span>
                  <select
                    className={s.select}
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    disabled={loading}
                  >
                    {BOARDS.map((board) => (
                      <option key={board.slug} value={`board:${board.slug}`}>
                        /{board.slug}/ {getLocalizedBoardName(t, board)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {!boardMode && !parentId && (
                <select
                  className={s.select}
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value)}
                  disabled={loading}
                >
                  <option value="public">{t('social.public')}</option>
                  <option value="followers">{t('social.followers')}</option>
                  <option value="unlisted">{t('social.unlisted')}</option>
                </select>
              )}

              {boardMode && (
                <label className={s.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={effectiveAnonymous}
                    onChange={(event) => setAnonymous(event.target.checked)}
                    disabled={!isLoggedIn || loading}
                  />
                  <span>{isLoggedIn ? t('social.postAnonymously') : t('social.anonymous')}</span>
                </label>
              )}

              {effectiveAnonymous && (
                <input
                  className={s.anonInput}
                  value={anonymousName}
                  onChange={(event) => setAnonymousName(event.target.value)}
                  maxLength={50}
                  placeholder={t('social.name')}
                  disabled={loading}
                />
              )}
            </div>

            <button className={s.submitButton} type="submit" disabled={loading || !content.trim()}>
              <Send size={15} />
              <span>{loading ? t('social.posting') : parentId ? t('social.reply') : boardMode ? t('social.thread') : t('social.post')}</span>
            </button>
          </div>

          {error && <div className={s.formError}>{error}</div>}
        </div>
      </div>
    </form>
  )
}

export default SocialComposer
