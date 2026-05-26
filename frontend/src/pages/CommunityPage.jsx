import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import CreatePostForm from "../components/community/CreatePostForm";
import EmotionalFilterBar from "../components/community/EmotionalFilterBar";
import PostCard from "../components/community/PostCard";
import { createCommunityPost, getCommunityPosts } from "../services/communityApi";
import { collectMoods, inferMood } from "../utils/postMood";
import "../styles/community.css";

function sortByLatest(posts) {
  return [...posts].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

export default function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [activeMood, setActiveMood] = useState("all");

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      setFetchError("");
      try {
        const data = await getCommunityPosts();
        setPosts(sortByLatest(data));
      } catch (error) {
        setFetchError(error.message || "Failed to load community feed.");
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const moods = useMemo(() => collectMoods(posts), [posts]);

  const filteredPosts = useMemo(() => {
    if (activeMood === "all") return posts;
    return posts.filter((post) => inferMood(post.text).key === activeMood);
  }, [posts, activeMood]);

  const handleCreate = async (text) => {
    setCreateError("");
    setCreating(true);
    try {
      const created = await createCommunityPost(text);
      setPosts((prev) => sortByLatest([created, ...prev]));
    } catch (error) {
      setCreateError(error.message || "Unable to create post.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="community-page">
      <header className="community-header">
        <div>
          <p className="community-kicker">Faith Community</p>
          <h1>Anonymous Emotional Feed</h1>
          <p className="community-subtitle">Share honestly. Read gently. Support quietly.</p>
        </div>
        <Link className="community-back" to="/">Back to Chat</Link>
      </header>

      <main className="community-layout">
        <section className="community-column composer-column">
          <CreatePostForm onCreate={handleCreate} isSubmitting={creating} error={createError} />
        </section>

        <section className="community-column feed-column">
          <div className="feed-header">
            <h2>Emotional Feed</h2>
            <p>{posts.length} posts</p>
          </div>
          <EmotionalFilterBar moods={moods} activeMood={activeMood} onChange={setActiveMood} />

          {loading && <p className="feed-status">Loading posts...</p>}
          {fetchError && <p className="feed-status error">{fetchError}</p>}

          {!loading && !fetchError && (
            <div className="post-list">
              {filteredPosts.length === 0 ? (
                <p className="feed-status">No posts found for this mood yet.</p>
              ) : (
                <AnimatePresence initial={false}>
                  {filteredPosts.map((post) => {
                    const mood = inferMood(post.text);
                    return (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <PostCard post={post} mood={mood} />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
