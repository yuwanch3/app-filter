package com.appfilter.filter
class KeywordFilter {
    private var keywords: Set<String> = defaultKeywords()
    fun updateKeywords(k: List<String>) { keywords = k.map { it.lowercase().trim() }.toSet() }
    fun matches(text: String): Boolean { val l = text.lowercase(); return keywords.any { l.contains(it) } }
    fun getMatchedKeyword(text: String): String? { val l = text.lowercase(); return keywords.firstOrNull { l.contains(it) } }
    fun getKeywords(): List<String> = keywords.toList()
    private fun defaultKeywords() = setOf("porn","porno","pornografi","xxx","sex","seks","dewasa 18+","18+","nsfw","bokep","viral bokep","bugil","telanjang","nude","naked","sexy","hot video","hot girl","hot model")
}