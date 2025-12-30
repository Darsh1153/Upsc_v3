import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { useAuth } from '../../../context/AuthContext';
// import { fetchUserNotes, deleteNote } from '../services/notesApi';
// import { useSearchNotes } from '../hooks/useSearchNotes';
// import { NoteListItem } from '../types';
// import { Input } from '../../../components/Input';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NoteListScreenProps {
    navigation: any;
}

export const NoteListScreen: React.FC<NoteListScreenProps> = ({ navigation }) => {
    // Logic commented out for "Coming Soon" state
    /*
    const { user } = useAuth();
    const userId = user?.id || 1;
    // ... existing state and logic ...
    */

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notes</Text>
                <View style={{ width: 32 }} />
                {/* 
                <TouchableOpacity onPress={handleCreateNote} style={styles.addButton}>
                    <Ionicons name="add" size={28} color="#6366f1" />
                </TouchableOpacity> 
                */}
            </View>

            {/* Coming Soon Content */}
            <View style={styles.comingSoonContainer}>
                <View style={styles.iconContainer}>
                    <Ionicons name="journal-outline" size={80} color="#6366f1" />
                    <View style={styles.badge}>
                        <Ionicons name="time" size={20} color="#fff" />
                    </View>
                </View>

                <Text style={styles.comingSoonTitle}>Coming Soon</Text>
                <Text style={styles.comingSoonText}>
                    We're building a powerful note-taking experience for your UPSC preparation.
                </Text>

                <View style={styles.featureList}>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text style={styles.featureText}>Rich Text Editor</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text style={styles.featureText}>Organize with Tags</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text style={styles.featureText}>Sync across devices</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    comingSoonContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        backgroundColor: '#fff',
    },
    iconContainer: {
        marginBottom: 32,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: '#F59E0B',
        padding: 6,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#fff',
    },
    comingSoonTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
    },
    comingSoonText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    featureList: {
        gap: 16,
        alignItems: 'flex-start',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        width: 240,
    },
    featureText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
});

export default NoteListScreen;
