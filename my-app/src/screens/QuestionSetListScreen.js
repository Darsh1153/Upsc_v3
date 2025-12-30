import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useTheme } from '../features/Reference/theme/ThemeContext';

const QuestionSetListScreen = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSets();
    }, []);

    const fetchSets = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('question_sets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSets(data || []);
        } catch (error) {
            console.error('Error fetching sets:', error);
            Alert.alert('Error', 'Failed to load question banks');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.colors.text }]}>Question Banks</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : sets.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="library-outline" size={64} color={theme.colors.textSecondary} />
                    <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                        No question banks available
                    </Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContainer}>
                    {sets.map((set) => (
                        <TouchableOpacity
                            key={set.id}
                            style={[styles.card, { backgroundColor: theme.colors.surface }]}
                            onPress={() => navigation.navigate('QuestionPaper', { setId: set.id, title: set.title })}
                        >
                            <View style={styles.cardIcon}>
                                <Ionicons name="book" size={24} color={theme.colors.primary} />
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{set.title}</Text>
                                <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                                    {set.description || 'Practice questions for this year'}
                                </Text>
                                <View style={styles.metaRow}>
                                    <View style={[styles.yearBadge, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                                        <Text style={[styles.yearText, { color: theme.colors.textSecondary }]}>{set.year}</Text>
                                    </View>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 13,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    yearBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    yearText: {
        fontSize: 11,
        fontWeight: '600',
    },
});

export default QuestionSetListScreen;
