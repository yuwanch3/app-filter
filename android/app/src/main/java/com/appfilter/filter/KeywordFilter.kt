package com.appfilter.filter

class KeywordFilter {
    private var keywords: Set<String> = defaultKeywords()

    fun updateKeywords(newKeywords: List<String>) {
        keywords = newKeywords.map { it.lowercase().trim() }.toSet()
    }

    fun matches(text: String): Boolean {
        val lower = text.lowercase()
        return keywords.any { lower.contains(it) }
    }

    fun getMatchedKeyword(text: String): String? {
        val lower = text.lowercase()
        return keywords.firstOrNull { lower.contains(it) }
    }

    fun getKeywords(): List<String> = keywords.toList()

    private fun defaultKeywords(): Set<String> = setOf(
        "porn", "porno", "pornografi", "xxx", "sex", "seks",
        "dewasa 18+", "18+", "nsfw", "bokep", "viral bokep",
        "bugil", "telanjang", "nude", "naked", "sexy",
        "hot video", "hot girl", "hot model",
    )
}