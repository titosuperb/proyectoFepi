import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
} from 'react-native';

import DropDownPicker from 'react-native-dropdown-picker';
import { launchCamera } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';

import { INFRACCIONES } from '../data/infracciones';
import { guardarInfraccionDB } from '../services/db';

export default function CapturaInfraccionScreen() {
  // ================= ESTADO =================
  const [placa, setPlaca] = useState('');

  const [open, setOpen] = useState(false);
  const [motivoId, setMotivoId] = useState<string | null>(null);
  const [items, setItems] = useState(
    INFRACCIONES.map(i => ({
      label: i.descripcion,
      value: i.id,
    }))
  );

  const [fotos, setFotos] = useState<string[]>([]);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lon: number } | null>(null);

  const infraccionSeleccionada = INFRACCIONES.find(i => i.id === motivoId);

  // ================= UBICACIÓN (MANUAL) =================
  const obtenerUbicacion = async (): Promise<{ lat: number; lon: number } | null> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permiso de ubicación',
          message:
            'La app necesita acceder a tu ubicación para registrar la infracción',
          buttonNeutral: 'Preguntar después',
          buttonNegative: 'Cancelar',
          buttonPositive: 'Aceptar',
        }
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permiso denegado', 'No se puede obtener la ubicación');
        return null;
      }
    }

    return new Promise(resolve => {
      Geolocation.getCurrentPosition(
        pos => {
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        error => {
          console.log(error);
          Alert.alert('Error', 'No se pudo obtener la ubicación');
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  };

  // ================= CÁMARA =================
  const tomarFoto = () => {
    launchCamera({ mediaType: 'photo', saveToPhotos: true }, response => {
      if (!response.didCancel && response.assets) {
        setFotos(prev => [...prev, response.assets![0].uri!]);
      }
    });
  };

  // ================= LIMPIAR FORMULARIO =================
  const limpiarFormulario = () => {
    setPlaca('');
    setMotivoId(null);
    setFotos([]);
    setUbicacion(null);
  };

  // ================= GUARDAR =================
  const guardarInfraccion = () => {
    if (!placa || !motivoId || fotos.length === 0 || !ubicacion) {
      Alert.alert(
        'Error',
        'Faltan datos obligatorios. Asegúrate de obtener la ubicación.'
      );
      return;
    }

    const infraccion = {
      placa,
      articulo: infraccionSeleccionada?.articulo,
      fraccion: infraccionSeleccionada?.fraccion,
      inciso: infraccionSeleccionada?.inciso,
      descripcion: infraccionSeleccionada?.descripcion,
      fotos,
      ubicacion,
      fecha: new Date().toISOString(),
    };

    guardarInfraccionDB(infraccion);

    Alert.alert(
      'Infracción registrada',
      'La infracción se guardó correctamente.',
      [
        {
          text: 'Registrar otra',
          onPress: () => {
            limpiarFormulario();
          },
        },
        {
          text: 'Aceptar',
          style: 'cancel',
        },
      ]
    );
  };

  // ================= UI =================
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Registro de Infracción</Text>

      <Text>Placa del vehículo</Text>
      <TextInput
        style={styles.input}
        value={placa}
        onChangeText={setPlaca}
        placeholder="ABC-123"
      />

      <Text>Motivo de la infracción</Text>
      <DropDownPicker
        open={open}
        value={motivoId}
        items={items}
        setOpen={setOpen}
        setValue={setMotivoId}
        setItems={setItems}
        searchable
        searchPlaceholder="Buscar motivo..."
        placeholder="Selecciona el motivo"
        style={{ marginBottom: open ? 220 : 15 }}
      />

      <Text>Artículo</Text>
      <TextInput
        style={styles.input}
        editable={false}
        value={infraccionSeleccionada?.articulo || ''}
      />

      <Text>Fracción</Text>
      <TextInput
        style={styles.input}
        editable={false}
        value={infraccionSeleccionada?.fraccion || ''}
      />

      <Text>Inciso</Text>
      <TextInput
        style={styles.input}
        editable={false}
        value={infraccionSeleccionada?.inciso || ''}
      />

      <Button title="Tomar evidencia" onPress={tomarFoto} />

      <ScrollView horizontal>
        {fotos.map((uri, idx) => (
          <View key={idx} style={styles.contenedorFoto}>
            <Image source={{ uri }} style={styles.foto} />
            <TouchableOpacity
              style={styles.botonEliminar}
              onPress={() =>
                setFotos(prev => prev.filter((_, i) => i !== idx))
              }
            >
              <Text style={styles.textoEliminar}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* BOTÓN MANUAL DE UBICACIÓN */}
      <View style={styles.botonUbicacion}>
        <Button
          title="Obtener ubicación"
          onPress={async () => {
            const ub = await obtenerUbicacion();
            if (ub) {
              setUbicacion(ub);
              Alert.alert('Ubicación obtenida', 'La ubicación fue registrada correctamente');
            }
          }}
        />
      </View>

      <Text style={styles.textoUbicacion}>
        Ubicación:{' '}
        {ubicacion
          ? `${ubicacion.lat.toFixed(5)}, ${ubicacion.lon.toFixed(5)}`
          : 'No obtenida'}
      </Text>

      <View style={styles.botonGuardar}>
        <Button title="Guardar infracción" onPress={guardarInfraccion} />
      </View>
    </ScrollView>
  );
}

// ================= ESTILOS =================
const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    padding: 8,
    marginBottom: 15,
  },
  contenedorFoto: {
    position: 'relative',
    marginRight: 10,
    marginTop: 10,
  },
  foto: {
    width: 100,
    height: 100,
  },
  botonEliminar: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'red',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoEliminar: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  botonUbicacion: {
    marginTop: 15,
    marginBottom: 10,
  },
  textoUbicacion: {
    marginTop: 10,
  },
  botonGuardar: {
    marginTop: 20,
  },
});
