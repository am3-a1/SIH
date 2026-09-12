package gov.mosje.sih26095.ui.audit

import android.graphics.BitmapFactory
import android.util.Base64
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import gov.mosje.sih26095.R
import gov.mosje.sih26095.api.models.EvidencePhoto
import java.io.File

class PhotoGalleryAdapter(
    private val photos: MutableList<EvidencePhoto> = mutableListOf(),
    private val onPhotoClick: ((EvidencePhoto) -> Unit)? = null
) : RecyclerView.Adapter<PhotoGalleryAdapter.PhotoViewHolder>() {

    class PhotoViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val imgThumb: ImageView = view.findViewById(R.id.imgEvidenceThumb)
        val txtCategory: TextView = view.findViewById(R.id.txtEvidenceCategory)
        val txtHash: TextView = view.findViewById(R.id.txtEvidenceHash)
        val txtTime: TextView = view.findViewById(R.id.txtEvidenceTime)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PhotoViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_evidence_photo, parent, false)
        return PhotoViewHolder(view)
    }

    override fun onBindViewHolder(holder: PhotoViewHolder, position: Int) {
        val photo = photos[position]
        holder.txtCategory.text = photo.category
        holder.txtHash.text = "SHA: ${photo.sha256Hash.take(12)}..."
        holder.txtTime.text = photo.timestampUtc

        // Load thumbnail from local file or base64
        val file = File(photo.localFilePath)
        if (file.exists()) {
            val bmp = BitmapFactory.decodeFile(file.absolutePath)
            holder.imgThumb.setImageBitmap(bmp)
        } else if (!photo.base64Thumbnail.isNullOrEmpty()) {
            try {
                val bytes = Base64.decode(photo.base64Thumbnail, Base64.DEFAULT)
                val bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                holder.imgThumb.setImageBitmap(bmp)
            } catch (e: Exception) {
                holder.imgThumb.setImageResource(R.drawable.ic_camera)
            }
        } else {
            holder.imgThumb.setImageResource(R.drawable.ic_camera)
        }

        holder.itemView.setOnClickListener {
            onPhotoClick?.invoke(photo)
        }
    }

    override fun getItemCount(): Int = photos.size

    fun addPhoto(photo: EvidencePhoto) {
        photos.add(0, photo)
        notifyItemInserted(0)
    }

    fun getPhotos(): List<EvidencePhoto> = photos
}
