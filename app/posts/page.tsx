import { dayjs } from '@/lib/dayjs'
import { pages } from '@/lib/data'
import { siteConfig } from '@/lib/config'
import { Pagination } from '@/components/pagination'
import { PostListItem } from '@/components/post-list-item'
import { getAllPosts } from '@/lib/posts'
import { YEAR_DESC_MAP } from '@/lib/year-desc'
import { generateCanonicalUrl, generateBreadcrumbSchema, generateWebPageSchema } from '@/lib/seo'

import type { Metadata } from 'next'

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{
    page?: string
  }>
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: pages.posts.title,
    description: pages.posts.description,
    alternates: {
      canonical: generateCanonicalUrl(pages.posts.slug),
    },
    openGraph: {
      type: 'website',
      locale: siteConfig.locale.replace('-', '_'),
      url: generateCanonicalUrl(pages.posts.slug),
      title: `${pages.posts.title} | ${siteConfig.name}`,
      description: pages.posts.description,
      siteName: siteConfig.name,
      images: [
        {
          url: `${siteConfig.url}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: pages.posts.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${pages.posts.title} | ${siteConfig.name}`,
      description: pages.posts.description,
      images: [`${siteConfig.url}/opengraph-image`],
    },
  }
}

export default async function PostsPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams
  const allPosts = await getAllPosts()
  const pinnedPosts = allPosts.filter((post) => post.top)
  const posts = allPosts.filter((post) => !post.top)

  // 计算总字数
  const totalWords = allPosts.reduce((sum, post) => sum + post.wordCount, 0)

  // 分页（置顶文章仅在第一页显示）
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE))
  const page = Math.min(Math.max(Math.floor(Number(pageParam)) || 1, 1), totalPages)
  const pagePosts = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // 按年份分组
  const postsByYear = Object.groupBy(pagePosts, (post) => dayjs(post.date).year())
  const allYears = Object.keys(postsByYear)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateWebPageSchema(pages.posts.title, pages.posts.description, pages.posts.slug),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateBreadcrumbSchema([
              { name: '首页', url: '/' },
              { name: pages.posts.title, url: pages.posts.slug },
            ]),
          ),
        }}
      />
      <div className="space-y-12 py-8 sm:py-12">
        {/* Header */}
        <section className="space-y-3">
          <h1 className="text-3xl font-bold sm:text-4xl">{pages.posts.title}</h1>
          <p className="text-text-secondary">
            {`${pages.posts.description}，共 ${allPosts.length.toLocaleString('zh-Hans-CN')} 篇，累计 ${totalWords.toLocaleString('zh-Hans-CN')} 字，按年份分组展示，第 ${page} / ${totalPages} 页。`}
          </p>
        </section>

        {/* Pinned Posts */}
        {page === 1 && pinnedPosts.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-text-primary text-xl font-bold sm:text-2xl">
              置顶{' '}
              <span className="text-text-tertiary text-base font-normal sm:text-lg">
                ({pinnedPosts.length.toLocaleString('zh-Hans-CN')})
              </span>
            </h2>
            <div className="border-border-tertiary space-y-1 border-l-2 pl-4 sm:pl-6">
              {pinnedPosts.map((post) => (
                <PostListItem key={post.slug} post={post} />
              ))}
            </div>
          </section>
        )}

        {/* Posts by Year */}
        <section className="space-y-12">
          {allYears.map((year) => {
            const yearPosts = postsByYear[year] || []

            return (
              <div key={year} className="space-y-4 sm:space-y-6">
                {/* 年份标题 */}
                <h2 className="text-text-primary text-xl font-bold sm:text-2xl">
                  <span>{year}</span>
                  <span className="text-text-tertiary/60 mx-1">/</span>
                  <span className="text-text-tertiary">{YEAR_DESC_MAP.get(year)}</span>
                  <span className="text-text-tertiary mx-1 text-base font-normal sm:text-lg">
                    ({yearPosts.length.toLocaleString('zh-Hans-CN')})
                  </span>
                </h2>
                <div className="border-border-tertiary space-y-1 border-l-2 pl-4 sm:pl-6">
                  {yearPosts.map((post) => (
                    <PostListItem key={post.slug} post={post} />
                  ))}
                </div>
              </div>
            )
          })}
        </section>

        {/* 分页 */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          buildHref={(p) => (p === 1 ? '/posts' : `/posts?page=${p}`)}
        />
      </div>
    </>
  )
}
